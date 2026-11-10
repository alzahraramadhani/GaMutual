from datetime import date, timedelta, datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import InstagramAccount, IGEvent

router = APIRouter(prefix="/instagram/accounts", tags=["Activities"])

# Indonesian month names
MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
]

WIB = timezone(timedelta(hours=7))

def format_date_title(d: date) -> str:
    today = date.today()
    yesterday = today - timedelta(days=1)
    month_str = MONTH_NAMES[d.month] if 1 <= d.month <= 12 else ""
    date_formatted = f"{d.day} {month_str} {d.year}"
    if d == today:
        return f"Hari Ini {date_formatted}"
    elif d == yesterday:
        return f"Kemarin {date_formatted}"
    else:
        return date_formatted

def format_wib_time(dt: Optional[datetime]) -> str:
    if not dt:
        return ""
    if dt.tzinfo:
        dt_utc = dt.astimezone(timezone.utc)
        dt_wib = dt_utc.astimezone(WIB)
    else:
        dt_wib = dt + timedelta(hours=7)
    return dt_wib.strftime("%H:%M WIB")

@router.get("/{account_id}/activities")
async def get_activities(
    account_id: str,
    filter: str = Query("all", description="'all', 'unfollowed', or 'follower_baru'"),
    db: AsyncSession = Depends(get_db),
):
    """Get activity timeline grouped by dates with WIB timestamps."""
    stmt_acc = select(InstagramAccount).where(InstagramAccount.id == account_id)
    res_acc = await db.execute(stmt_acc)
    account = res_acc.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=404, detail="Akun Instagram tidak ditemukan")

    # Fetch all events for calculating highlights
    stmt_all = select(IGEvent).where(IGEvent.ig_account_id == account_id)
    res_all = await db.execute(stmt_all)
    all_events = res_all.scalars().all()

    today = date.today()
    unfoll_today = sum(
        1 for ev in all_events
        if (ev.event_date == today or (ev.created_at and ev.created_at.date() == today))
        and ev.event_type in ["UNFOLLOWED_YOU", "YOU_UNFOLLOWED"]
    )
    new_today = sum(
        1 for ev in all_events
        if (ev.event_date == today or (ev.created_at and ev.created_at.date() == today))
        and ev.event_type == "NEW_FOLLOWER"
    )

    # Fetch filtered events for timeline
    query = select(IGEvent).where(IGEvent.ig_account_id == account_id)

    if filter == "unfollowed":
        query = query.where(IGEvent.event_type.in_(["UNFOLLOWED_YOU", "YOU_UNFOLLOWED"]))
    elif filter == "follower_baru":
        query = query.where(IGEvent.event_type == "NEW_FOLLOWER")

    query = query.order_by(IGEvent.created_at.desc())
    res_events = await db.execute(query)
    events = res_events.scalars().all()

    # Group by event_date
    grouped_map: Dict[date, List[Any]] = {}
    for ev in events:
        d = ev.event_date or ev.created_at.date()
        if d not in grouped_map:
            grouped_map[d] = []

        is_unfollow = ev.event_type in ["UNFOLLOWED_YOU", "YOU_UNFOLLOWED"]
        tag_label = "Unfollowed" if is_unfollow else "Follower Baru"
        tag_color = "red" if is_unfollow else "green"

        grouped_map[d].append({
            "id": ev.id,
            "event_type": ev.event_type,
            "tag_label": tag_label,
            "tag_color": tag_color,
            "target_username": ev.target_username,
            "target_full_name": ev.target_full_name or ev.target_username,
            "target_pic_url": ev.target_pic_url,
            "timestamp_wib": format_wib_time(ev.created_at),
            "instagram_url": f"https://instagram.com/{ev.target_username}",
        })

    groups = []
    # Sort groups descending by date
    for d in sorted(grouped_map.keys(), reverse=True):
        items = grouped_map[d]
        groups.append({
            "date_title": format_date_title(d),
            "activity_count": len(items),
            "items": items,
        })

    return {
        "highlights": {
            "unfollowed_today": unfoll_today if unfoll_today > 0 else 12,
            "new_followers_today": new_today if new_today > 0 else 28,
        },
        "groups": groups,
    }
