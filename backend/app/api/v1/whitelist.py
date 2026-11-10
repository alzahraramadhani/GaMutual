import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import InstagramAccount, IGRelationship, IGWhitelist

router = APIRouter(prefix="/instagram/accounts", tags=["Whitelist"])

class WhitelistToggleRequest(BaseModel):
    target_ig_pk: str
    target_username: str

@router.post("/{account_id}/whitelist/toggle")
async def toggle_whitelist(
    account_id: str,
    payload: WhitelistToggleRequest,
    db: AsyncSession = Depends(get_db),
):
    """Toggle protected status (whitelist) for a target account."""
    stmt_acc = select(InstagramAccount).where(InstagramAccount.id == account_id)
    res_acc = await db.execute(stmt_acc)
    account = res_acc.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=404, detail="Akun Instagram tidak ditemukan")

    # Find relationship record
    stmt_rel = select(IGRelationship).where(
        IGRelationship.ig_account_id == account_id,
        IGRelationship.target_ig_pk == payload.target_ig_pk,
    )
    res_rel = await db.execute(stmt_rel)
    rel = res_rel.scalar_one_or_none()

    # Find whitelist record
    stmt_wl = select(IGWhitelist).where(
        IGWhitelist.ig_account_id == account_id,
        IGWhitelist.target_ig_pk == payload.target_ig_pk,
    )
    res_wl = await db.execute(stmt_wl)
    wl_entry = res_wl.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    new_state = False

    if wl_entry:
        # Currently in whitelist -> Remove it
        await db.delete(wl_entry)
        if rel:
            rel.is_whitelisted = False
        new_state = False
        message = f"@{payload.target_username} dihapus dari List Terlindungi"
    else:
        # Not in whitelist -> Add it
        new_entry = IGWhitelist(
            id=str(uuid.uuid4()),
            ig_account_id=account.id,
            target_ig_pk=payload.target_ig_pk,
            target_username=payload.target_username,
            target_full_name=rel.target_full_name if rel else payload.target_username,
            target_pic_url=rel.target_pic_url if rel else None,
            reason="Akun Terlindungi",
            created_at=now,
        )
        db.add(new_entry)
        if rel:
            rel.is_whitelisted = True
        new_state = True
        message = f"@{payload.target_username} sekarang berada dalam List Terlindungi"

    await db.commit()

    return {
        "status": "SUCCESS",
        "is_whitelisted": new_state,
        "message": message,
    }

@router.get("/{account_id}/whitelist")
async def list_whitelist(account_id: str, db: AsyncSession = Depends(get_db)):
    """List all accounts currently in the whitelist."""
    stmt = select(IGWhitelist).where(IGWhitelist.ig_account_id == account_id).order_by(IGWhitelist.created_at.desc())
    res = await db.execute(stmt)
    entries = res.scalars().all()

    items = []
    for item in entries:
        items.append({
            "target_ig_pk": item.target_ig_pk,
            "target_username": item.target_username,
            "target_full_name": item.target_full_name,
            "target_pic_url": item.target_pic_url,
            "reason": item.reason,
            "instagram_url": f"https://instagram.com/{item.target_username}",
        })

    return {
        "count": len(items),
        "items": items,
    }
