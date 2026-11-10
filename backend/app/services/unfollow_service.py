import uuid
from datetime import datetime, timezone, date
from typing import Dict, Any, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.db.models import (
    InstagramAccount,
    IGRelationship,
    IGEvent,
    IGWhitelist,
    UnfollowLog,
)
from app.core.anti_ban import anti_ban
from app.core.security import decrypt_data
from app.services.ig_client import ig_service

class UnfollowService:
    async def execute_unfollow(
        self,
        account: InstagramAccount,
        target_ig_pk: str,
        target_username: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Safely execute unfollow with anti-ban cooldown, quota protection, and account-level mutex.
        """
        async with anti_ban.get_lock(account.id):
            # 1. Cooldown check
            in_cooldown, remaining_seconds = await anti_ban.is_in_cooldown(account.id)
            if in_cooldown:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "status": "RATE_LIMITED",
                        "message": "Harap tunggu jeda aman sebelum unfollow berikutnya demi keamanan akun Anda",
                        "remaining_cooldown_seconds": remaining_seconds,
                    },
                )

            # 2. Daily quota check & reset
            quota_limit, used_today, remaining_quota = anti_ban.check_and_reset_quota(account)
            if remaining_quota <= 0:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "status": "QUOTA_EXCEEDED",
                        "message": "Batas kuota harian unfollow (40 aksi) telah tercapai demi keamanan akun Anda. Coba lagi besok.",
                        "remaining_quota": 0,
                    },
                )

            # 3. Whitelist check (both relationship flag and whitelist table)
            stmt = select(IGRelationship).where(
                IGRelationship.ig_account_id == account.id,
                IGRelationship.target_ig_pk == target_ig_pk,
            )
            res = await db.execute(stmt)
            relationship = res.scalar_one_or_none()

            stmt_wl = select(IGWhitelist).where(
                IGWhitelist.ig_account_id == account.id,
                IGWhitelist.target_ig_pk == target_ig_pk,
            )
            res_wl = await db.execute(stmt_wl)
            is_wl_table = res_wl.scalar_one_or_none() is not None

            if (relationship and relationship.is_whitelisted) or is_wl_table:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "status": "WHITELISTED",
                        "message": f"@{target_username} berada dalam List Terlindungi. Hapus dari whitelist terlebih dahulu jika ingin unfollow.",
                    },
                )

            # 4. Decrypt session & call IG client
            session_data = decrypt_data(account.encrypted_session_data)
            ig_service.unfollow_user(session_data, target_ig_pk)

            # 5. Apply randomized cooldown (8-15 seconds)
            cooldown_applied = await anti_ban.apply_cooldown(account.id)

            # 6. Increment quota & update following count
            account.daily_unfollow_used = (account.daily_unfollow_used or 0) + 1
            account.following_count = max(0, (account.following_count or 0) - 1)
            new_used = account.daily_unfollow_used
            new_remaining = max(0, quota_limit - new_used)

            # Update relationship
            if relationship:
                relationship.is_following = False
                relationship.last_checked_at = datetime.now(timezone.utc)

            # 7. Insert audit log
            log = UnfollowLog(
                id=str(uuid.uuid4()),
                ig_account_id=account.id,
                target_ig_pk=target_ig_pk,
                target_username=target_username,
                status="SUCCESS",
                cooldown_applied_seconds=cooldown_applied,
                executed_at=datetime.now(timezone.utc),
            )
            db.add(log)

            # 8. Insert activity event
            event = IGEvent(
                id=str(uuid.uuid4()),
                ig_account_id=account.id,
                target_ig_pk=target_ig_pk,
                target_username=target_username,
                target_full_name=relationship.target_full_name if relationship else target_username,
                target_pic_url=relationship.target_pic_url if relationship else None,
                event_type="YOU_UNFOLLOWED",
                event_date=date.today(),
                created_at=datetime.now(timezone.utc),
            )
            db.add(event)

            await db.commit()

            return {
                "status": "SUCCESS",
                "message": f"Berhasil berhenti mengikuti @{target_username}",
                "unfollow_state": "COMPLETED",
                "cooldown_seconds": cooldown_applied,
                "quota": {
                    "used_today": new_used,
                    "quota_limit": quota_limit,
                    "remaining_quota": new_remaining,
                },
            }

unfollow_service = UnfollowService()
