from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import InstagramAccount, IGRelationship
from app.core.anti_ban import anti_ban
from app.services.unfollow_service import unfollow_service

router = APIRouter(prefix="/instagram/accounts", tags=["Unfollowers & Actions"])

class UnfollowActionRequest(BaseModel):
    target_ig_pk: str
    target_username: str

@router.get("/{account_id}/unfollowers")
async def get_unfollowers(
    account_id: str,
    filter: str = Query("all", description="'all' or 'whitelisted'"),
    search: Optional[str] = Query(None, description="Search keyword"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get list of non-mutual accounts (unfollowers) with search & filter."""
    stmt_acc = select(InstagramAccount).where(InstagramAccount.id == account_id)
    res_acc = await db.execute(stmt_acc)
    account = res_acc.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=404, detail="Akun Instagram tidak ditemukan")

    # Anti-ban quota
    quota_limit, used_today, remaining_quota = anti_ban.check_and_reset_quota(account)
    await db.commit()

    # Base query for non-mutuals (following = true, follower = false)
    base_query = select(IGRelationship).where(
        IGRelationship.ig_account_id == account_id,
        IGRelationship.is_following == True,
        IGRelationship.is_follower == False,
    )

    # Count total non-mutuals
    stmt_total = select(func.count(IGRelationship.id)).where(
        IGRelationship.ig_account_id == account_id,
        IGRelationship.is_following == True,
        IGRelationship.is_follower == False,
    )
    res_total = await db.execute(stmt_total)
    total_count = res_total.scalar() or 0

    # Count whitelisted
    stmt_wl = select(func.count(IGRelationship.id)).where(
        IGRelationship.ig_account_id == account_id,
        IGRelationship.is_following == True,
        IGRelationship.is_follower == False,
        IGRelationship.is_whitelisted == True,
    )
    res_wl = await db.execute(stmt_wl)
    whitelisted_count = res_wl.scalar() or 0

    # Apply filter
    query = base_query
    if filter == "whitelisted":
        query = query.where(IGRelationship.is_whitelisted == True)

    # Apply search
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(IGRelationship.target_username).like(term),
                func.lower(IGRelationship.target_full_name).like(term),
            )
        )

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    res_items = await db.execute(query)
    rels = res_items.scalars().all()

    items = []
    for r in rels:
        items.append({
            "target_ig_pk": r.target_ig_pk,
            "target_username": r.target_username,
            "target_full_name": r.target_full_name,
            "target_pic_url": r.target_pic_url,
            "is_whitelisted": r.is_whitelisted,
            "instagram_url": f"https://instagram.com/{r.target_username}",
            "unfollow_state": "NORMAL",
        })

    return {
        "total_count": total_count,
        "whitelisted_count": whitelisted_count,
        "anti_ban": {
            "used_today": used_today,
            "quota_limit": quota_limit,
            "remaining_quota": remaining_quota,
            "status": "Status: Aman",
        },
        "items": items,
    }

@router.post("/{account_id}/actions/unfollow")
async def unfollow_target(
    account_id: str,
    payload: UnfollowActionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Execute safe unfollow action with anti-ban cooldown and quota decrements."""
    stmt_acc = select(InstagramAccount).where(InstagramAccount.id == account_id)
    res_acc = await db.execute(stmt_acc)
    account = res_acc.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=404, detail="Akun Instagram tidak ditemukan")

    return await unfollow_service.execute_unfollow(
        account=account,
        target_ig_pk=payload.target_ig_pk,
        target_username=payload.target_username,
        db=db,
    )
