import asyncio
import random
import time
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
import redis.asyncio as aioredis
from app.core.config import settings
from app.db.models import InstagramAccount

WIB = timezone(timedelta(hours=7))

def to_utc(dt: datetime) -> datetime:
    """Ensure datetime is offset-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def get_next_wib_midnight(dt: Optional[datetime] = None) -> datetime:
    """Return the next 00:00:00 WIB represented in UTC."""
    now_utc = dt or datetime.now(timezone.utc)
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=timezone.utc)
    now_wib = now_utc.astimezone(WIB)
    next_midnight_wib = (now_wib + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return next_midnight_wib.astimezone(timezone.utc)

class AntiBanManager:
    def __init__(self):
        self._memory_cooldowns: dict[str, float] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._redis_client: Optional[aioredis.Redis] = None
        self._redis_checked = False

    def get_lock(self, account_id: str) -> asyncio.Lock:
        """Acquire per-account asyncio lock to prevent race conditions."""
        if account_id not in self._locks:
            self._locks[account_id] = asyncio.Lock()
        return self._locks[account_id]

    async def _get_redis(self) -> Optional[aioredis.Redis]:
        if not self._redis_checked:
            self._redis_checked = True
            try:
                client = aioredis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=0.5)
                await client.ping()
                self._redis_client = client
            except Exception:
                self._redis_client = None
        return self._redis_client

    @staticmethod
    def get_random_cooldown() -> int:
        """Returns a randomized cooldown between MIN and MAX seconds (e.g. 8-15s)."""
        return random.randint(settings.MIN_COOLDOWN_SECONDS, settings.MAX_COOLDOWN_SECONDS)

    async def is_in_cooldown(self, account_id: str) -> Tuple[bool, int]:
        """
        Check if an account is currently in cooldown.
        Returns: (is_blocked, remaining_seconds)
        """
        r = await self._get_redis()
        if r:
            try:
                ttl = await r.ttl(f"gamutual:cooldown:{account_id}")
                if ttl and ttl > 0:
                    return True, ttl
            except Exception:
                pass

        expiry = self._memory_cooldowns.get(account_id)
        if not expiry:
            return False, 0
        now = time.time()
        if now < expiry:
            remaining = int(expiry - now) + 1
            return True, remaining
        else:
            self._memory_cooldowns.pop(account_id, None)
            return False, 0

    async def apply_cooldown(self, account_id: str, custom_seconds: Optional[int] = None) -> int:
        """
        Apply a cooldown timer for an account.
        Returns: applied cooldown in seconds.
        """
        cooldown_sec = custom_seconds if custom_seconds is not None else self.get_random_cooldown()
        r = await self._get_redis()
        if r:
            try:
                await r.set(f"gamutual:cooldown:{account_id}", "1", ex=cooldown_sec)
            except Exception:
                pass
        self._memory_cooldowns[account_id] = time.time() + cooldown_sec
        return cooldown_sec

    @staticmethod
    def check_and_reset_quota(account: InstagramAccount) -> Tuple[int, int, int]:
        """
        Check daily unfollow quota, reset if past quota_reset_at (WIB midnight).
        Returns: (quota_limit, used_today, remaining_quota)
        """
        now = datetime.now(timezone.utc)
        if not account.quota_reset_at:
            # First time initialization: initialize next midnight without clearing current count
            account.quota_reset_at = get_next_wib_midnight(now)
        elif now >= to_utc(account.quota_reset_at):
            account.daily_unfollow_used = 0
            account.quota_reset_at = get_next_wib_midnight(now)

        limit = account.daily_unfollow_quota or settings.DEFAULT_DAILY_QUOTA
        used = account.daily_unfollow_used or 0
        remaining = max(0, limit - used)
        return limit, used, remaining

anti_ban = AntiBanManager()
