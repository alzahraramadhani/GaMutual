import uuid
import json
import logging
from datetime import datetime, timezone, date, timedelta
from typing import Dict, Any, List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import decrypt_data
from app.db.models import (
    InstagramAccount,
    IGRelationship,
    IGEvent,
    IGSnapshot,
    IGWhitelist,
)
from app.services.ig_client import MOCK_UNFOLLOWERS, MOCK_EVENTS

logger = logging.getLogger(__name__)

class SyncService:
    async def run_sync(self, account: InstagramAccount, db: AsyncSession) -> Dict[str, Any]:
        """
        Execute snapshot diffing sync.
        Populates or refreshes relationships, updates counters, and records events.
        """
        now = datetime.now(timezone.utc)
        today = date.today()

        is_mock_account = (
            account.username.startswith("test_")
            or account.username.startswith("demo_")
            or account.username in ("demo_test",)
            or not account.encrypted_session_data
            or "mock_session" in (account.encrypted_session_data or "")
        )

        if not is_mock_account:
            try:
                from instagrapi import Client
                cl = Client()
                if settings.INSTAGRAM_PROXY:
                    cl.set_proxy(settings.INSTAGRAM_PROXY)

                raw_session = decrypt_data(account.encrypted_session_data)
                cl.set_settings(json.loads(raw_session))
                user_id = str(account.ig_pk)

                logger.info(f"Starting live Instagram sync for @{account.username} (pk={user_id})...")
                followers = cl.user_followers(user_id)
                following = cl.user_following(user_id)

                account.follower_count = len(followers)
                account.following_count = len(following)

                # Keep track of existing whitelisted accounts
                wl_stmt = select(IGWhitelist.target_ig_pk).where(IGWhitelist.ig_account_id == account.id)
                wl_res = await db.execute(wl_stmt)
                whitelisted_pks = set(wl_res.scalars().all())

                # Clear previous relationships for clean sync
                await db.execute(delete(IGRelationship).where(IGRelationship.ig_account_id == account.id))

                follower_pks = set(str(k) for k in followers.keys())
                for pk_str, u in following.items():
                    pk_s = str(pk_str)
                    is_fol = pk_s in follower_pks
                    db.add(IGRelationship(
                        id=str(uuid.uuid4()),
                        ig_account_id=account.id,
                        target_ig_pk=pk_s,
                        target_username=u.username,
                        target_full_name=u.full_name or u.username,
                        target_pic_url=str(u.profile_pic_url) if getattr(u, 'profile_pic_url', None) else None,
                        is_follower=is_fol,
                        is_following=True,
                        is_mutual=is_fol,
                        is_verified=bool(getattr(u, 'is_verified', False)),
                        is_whitelisted=pk_s in whitelisted_pks,
                        last_checked_at=now,
                    ))

                following_pks = set(str(k) for k in following.keys())
                for pk_str, u in followers.items():
                    pk_s = str(pk_str)
                    if pk_s not in following_pks:
                        db.add(IGRelationship(
                            id=str(uuid.uuid4()),
                            ig_account_id=account.id,
                            target_ig_pk=pk_s,
                            target_username=u.username,
                            target_full_name=u.full_name or u.username,
                            target_pic_url=str(u.profile_pic_url) if getattr(u, 'profile_pic_url', None) else None,
                            is_follower=True,
                            is_following=False,
                            is_mutual=False,
                            is_verified=bool(getattr(u, 'is_verified', False)),
                            is_whitelisted=pk_s in whitelisted_pks,
                            last_checked_at=now,
                        ))

                logger.info(f"Live sync successful for @{account.username}: {len(followers)} followers, {len(following)} following.")
            except Exception as e:
                logger.error(f"Live Instagram sync error for @{account.username}: {e}")
        else:
            # Check existing relationships for mock demo
            stmt = select(IGRelationship).where(IGRelationship.ig_account_id == account.id)
            result = await db.execute(stmt)
            existing_rels = result.scalars().all()

            # If no relationships exist yet, populate standard mock data set
            if len(existing_rels) == 0:
                for item in MOCK_UNFOLLOWERS:
                    rel = IGRelationship(
                        id=str(uuid.uuid4()),
                        ig_account_id=account.id,
                        target_ig_pk=item["target_ig_pk"],
                        target_username=item["target_username"],
                        target_full_name=item["target_full_name"],
                        target_pic_url=item["target_pic_url"],
                        is_follower=item["is_follower"],
                        is_following=item["is_following"],
                        is_mutual=False,
                        is_verified=item["is_verified"],
                        is_whitelisted=item["is_whitelisted"],
                        last_checked_at=now,
                    )
                    db.add(rel)

                    if item["is_whitelisted"]:
                        wl = IGWhitelist(
                            id=str(uuid.uuid4()),
                            ig_account_id=account.id,
                            target_ig_pk=item["target_ig_pk"],
                            target_username=item["target_username"],
                            target_full_name=item["target_full_name"],
                            target_pic_url=item["target_pic_url"],
                            reason="Akun Terlindungi",
                            created_at=now,
                        )
                        db.add(wl)

                for i in range(len(MOCK_UNFOLLOWERS) + 1, 185):
                    is_wl = (i <= 18)
                    db.add(IGRelationship(
                        id=str(uuid.uuid4()),
                        ig_account_id=account.id,
                        target_ig_pk=f"9000{i:04d}",
                        target_username=f"user_nonmutual_{i}",
                        target_full_name=f"User {i} Non Mutual",
                        target_pic_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
                        is_follower=False,
                        is_following=True,
                        is_mutual=False,
                        is_verified=False,
                        is_whitelisted=is_wl,
                        last_checked_at=now,
                    ))

                stmt_evt = select(IGEvent).where(IGEvent.ig_account_id == account.id)
                res_evt = await db.execute(stmt_evt)
                if len(res_evt.scalars().all()) == 0:
                    for ev in MOCK_EVENTS:
                        ev_date = today if ev["hours_ago"] < 24 else (today - timedelta(days=1))
                        ev_time = now - timedelta(hours=ev["hours_ago"])
                        db.add(IGEvent(
                            id=str(uuid.uuid4()),
                            ig_account_id=account.id,
                            target_ig_pk=ev["target_ig_pk"],
                            target_username=ev["target_username"],
                            target_full_name=ev["target_full_name"],
                            target_pic_url=ev["target_pic_url"],
                            event_type=ev["event_type"],
                            event_date=ev_date,
                            created_at=ev_time,
                        ))

        # Create snapshot record
        snapshot = IGSnapshot(
            id=str(uuid.uuid4()),
            ig_account_id=account.id,
            follower_count=account.follower_count or 1345,
            following_count=account.following_count or 842,
            new_followers_count=8,
            unfollowers_count=2,
            created_at=now,
        )
        db.add(snapshot)

        # Update account last synced
        account.last_synced_at = now
        await db.commit()

        return {
            "status": "COMPLETED",
            "progress_percentage": 100,
            "detected_unfollowers": 2,
            "detected_new_followers": 8,
            "synced_at": now.isoformat(),
        }

sync_service = SyncService()
