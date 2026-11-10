import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import InstagramAccount
from app.core.security import encrypt_data, create_access_token
from app.core.anti_ban import get_next_wib_midnight
from app.services.ig_client import ig_service
from app.services.sync_service import sync_service

router = APIRouter(prefix="/auth/instagram", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str
    remember_device: Optional[bool] = True

class ChallengeVerifyRequest(BaseModel):
    temporary_session_id: str
    verification_code: str

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate Instagram account directly."""
    clean_username = req.username.strip().lstrip("@").lower()
    if not clean_username or not req.password:
        raise HTTPException(status_code=400, detail="Username dan password wajib diisi")

    try:
        result = ig_service.login(clean_username, req.password, req.remember_device)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal otentikasi ke Instagram: {str(e)}")

    # If challenge or 2FA is needed
    if result.get("status") == "CHALLENGE_REQUIRED":
        return result

    # Success: Save or update InstagramAccount in DB
    profile = result["profile"]
    ig_pk = profile["ig_pk"]

    stmt = select(InstagramAccount).where(
        or_(InstagramAccount.ig_pk == ig_pk, InstagramAccount.username == clean_username)
    )
    res = await db.execute(stmt)
    account = res.scalars().first()

    enc_session = encrypt_data(result["session_data"])
    enc_password = encrypt_data(req.password) if req.remember_device else None

    if not account:
        account = InstagramAccount(
            id=str(uuid.uuid4()),
            ig_pk=ig_pk,
            username=profile["username"],
            full_name=profile.get("full_name"),
            profile_pic_url=profile.get("profile_pic_url"),
            follower_count=profile.get("follower_count", 0),
            following_count=profile.get("following_count", 0),
            encrypted_session_data=enc_session,
            encrypted_password=enc_password,
            device_settings=result.get("device_settings"),
            status="ACTIVE",
            daily_unfollow_quota=40,
            daily_unfollow_used=0,
            quota_reset_at=get_next_wib_midnight(),
            remember_device=req.remember_device,
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)
    else:
        account.ig_pk = ig_pk
        account.username = profile["username"]
        account.full_name = profile.get("full_name")
        account.profile_pic_url = profile.get("profile_pic_url")
        account.follower_count = profile.get("follower_count", account.follower_count)
        account.following_count = profile.get("following_count", account.following_count)
        account.encrypted_session_data = enc_session
        if enc_password:
            account.encrypted_password = enc_password
        account.status = "ACTIVE"
        await db.commit()
        await db.refresh(account)

    # Trigger initial sync
    try:
        await sync_service.run_sync(account, db)
    except Exception as e_sync:
        import logging
        logging.getLogger("gamutual").warning(f"Initial sync warning: {e_sync}")

    token = create_access_token({"sub": account.id, "username": account.username})

    return {
        "status": "SUCCESS",
        "message": "Login berhasil, akun Instagram terhubung",
        "session_token": token,
        "account": {
            "id": account.id,
            "username": account.username,
            "full_name": account.full_name,
            "profile_pic_url": account.profile_pic_url,
            "follower_count": account.follower_count,
            "following_count": account.following_count,
            "is_encrypted": True,
        },
    }

@router.post("/challenge/verify")
async def verify_challenge(req: ChallengeVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Verify 2FA or Challenge code."""
    try:
        result = ig_service.verify_challenge(req.temporary_session_id, req.verification_code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    profile = result["profile"]
    ig_pk = profile["ig_pk"]

    stmt = select(InstagramAccount).where(
        or_(InstagramAccount.ig_pk == ig_pk, InstagramAccount.username == profile["username"])
    )
    res = await db.execute(stmt)
    account = res.scalars().first()

    enc_session = encrypt_data(result["session_data"])

    if not account:
        account = InstagramAccount(
            id=str(uuid.uuid4()),
            ig_pk=ig_pk,
            username=profile["username"],
            full_name=profile.get("full_name"),
            profile_pic_url=profile.get("profile_pic_url"),
            follower_count=profile.get("follower_count", 0),
            following_count=profile.get("following_count", 0),
            encrypted_session_data=enc_session,
            status="ACTIVE",
            daily_unfollow_quota=40,
            daily_unfollow_used=24,
            quota_reset_at=get_next_wib_midnight(),
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)
        await sync_service.run_sync(account, db)
    else:
        account.encrypted_session_data = enc_session
        account.status = "ACTIVE"
        await db.commit()
        await db.refresh(account)

    token = create_access_token({"sub": account.id, "username": account.username})

    return {
        "status": "SUCCESS",
        "message": "Verifikasi 2FA berhasil!",
        "session_token": token,
        "account_id": account.id,
    }

@router.get("/accounts")
async def get_accounts(active_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """List all saved accounts for account switcher."""
    stmt = select(InstagramAccount).order_by(InstagramAccount.created_at.desc())
    res = await db.execute(stmt)
    accounts = res.scalars().all()

    if not accounts:
        return {"active_account_id": None, "accounts": []}

    target_active = active_id if active_id else accounts[0].id

    items = []
    for acc in accounts:
        items.append({
            "id": acc.id,
            "username": acc.username,
            "full_name": acc.full_name,
            "profile_pic_url": acc.profile_pic_url,
            "follower_count": acc.follower_count,
            "following_count": acc.following_count,
            "is_active": acc.id == target_active,
        })

    return {
        "active_account_id": target_active,
        "accounts": items,
    }
