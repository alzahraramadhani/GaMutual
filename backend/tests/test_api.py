import pytest
import pytest_asyncio
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import init_db

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"
        assert data["version"] == "2.0.0"

@pytest.mark.asyncio
async def test_login_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Normal login
        res = await ac.post("/api/v1/auth/instagram/login", json={
            "username": "demo_test",
            "password": "Password123!",
            "remember_device": True,
        })
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUCCESS"
        assert "session_token" in data
        assert data["account"]["username"] == "demo_test"
        assert data["account"]["full_name"] == "Demo Tester"

        # 2. Challenge 2FA login
        res_challenge = await ac.post("/api/v1/auth/instagram/login", json={
            "username": "challenge_test",
            "password": "some_password",
            "remember_device": True,
        })
        assert res_challenge.status_code == 200
        ch_data = res_challenge.json()
        assert ch_data["status"] == "CHALLENGE_REQUIRED"
        assert "temporary_session_id" in ch_data

        # 3. Verify challenge
        res_verify = await ac.post("/api/v1/auth/instagram/challenge/verify", json={
            "temporary_session_id": ch_data["temporary_session_id"],
            "verification_code": "892014",
        })
        assert res_verify.status_code == 200
        ver_data = res_verify.json()
        assert ver_data["status"] == "SUCCESS"
        assert "session_token" in ver_data

@pytest.mark.asyncio
async def test_dashboard_and_sync():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/instagram/login", json={
            "username": "demo_test",
            "password": "Password123!",
        })
        acc_id = res.json()["account"]["id"]

        # Fetch dashboard
        res_dash = await ac.get(f"/api/v1/instagram/accounts/{acc_id}/home-dashboard")
        assert res_dash.status_code == 200
        dash = res_dash.json()
        assert dash["profile"]["username"] == "demo_test"
        assert "anti_ban" in dash
        assert dash["anti_ban"]["quota_limit"] == 40
        assert "relation_analysis" in dash
        assert dash["relation_analysis"]["tidak_follback_count"] >= 0

        # Trigger sync
        res_sync = await ac.post(f"/api/v1/instagram/accounts/{acc_id}/sync")
        assert res_sync.status_code == 200
        assert res_sync.json()["status"] == "COMPLETED"

        # Check sync status
        res_status = await ac.get(f"/api/v1/instagram/accounts/{acc_id}/sync/status")
        assert res_status.status_code == 200
        assert res_status.json()["status"] == "COMPLETED"

@pytest.mark.asyncio
async def test_unfollower_and_actions():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create fresh test account
        res = await ac.post("/api/v1/auth/instagram/login", json={
            "username": "test_unfoll_user",
            "password": "Password123!",
        })
        acc_id = res.json()["account"]["id"]

        # Get unfollowers list
        res_unfoll = await ac.get(f"/api/v1/instagram/accounts/{acc_id}/unfollowers?filter=all&page=1&limit=10")
        assert res_unfoll.status_code == 200
        unfoll_data = res_unfoll.json()
        assert unfoll_data["total_count"] > 0
        assert len(unfoll_data["items"]) > 0

        # Test search on first item
        first_item = unfoll_data["items"][0]
        search_query = first_item["target_username"][:5]
        res_search = await ac.get(f"/api/v1/instagram/accounts/{acc_id}/unfollowers?search={search_query}")
        assert res_search.status_code == 200
        search_items = res_search.json()["items"]
        assert len(search_items) > 0

        # Unfollow target
        target = next((item for item in unfoll_data["items"] if not item["is_whitelisted"]), unfoll_data["items"][0])
        res_action = await ac.post(f"/api/v1/instagram/accounts/{acc_id}/actions/unfollow", json={
            "target_ig_pk": target["target_ig_pk"],
            "target_username": target["target_username"],
        })
        assert res_action.status_code == 200
        act_data = res_action.json()
        assert act_data["status"] == "SUCCESS"
        assert act_data["unfollow_state"] == "COMPLETED"
        assert "cooldown_seconds" in act_data

        # Immediate second unfollow should trigger rate limiting 429
        res_action_blocked = await ac.post(f"/api/v1/instagram/accounts/{acc_id}/actions/unfollow", json={
            "target_ig_pk": "384910234",
            "target_username": "dimas_pratama",
        })
        assert res_action_blocked.status_code == 429
        blocked_data = res_action_blocked.json()["detail"]
        assert blocked_data["status"] == "RATE_LIMITED"
        assert blocked_data["remaining_cooldown_seconds"] > 0

@pytest.mark.asyncio
async def test_whitelist_toggle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/instagram/login", json={
            "username": "jjahrav",
            "password": "Password123!",
        })
        acc_id = res.json()["account"]["id"]

        # Toggle whitelist for a user
        res_toggle = await ac.post(f"/api/v1/instagram/accounts/{acc_id}/whitelist/toggle", json={
            "target_ig_pk": "384910234",
            "target_username": "dimas_pratama",
        })
        assert res_toggle.status_code == 200
        data = res_toggle.json()
        assert data["status"] == "SUCCESS"
        assert "is_whitelisted" in data

        # List whitelist
        res_list = await ac.get(f"/api/v1/instagram/accounts/{acc_id}/whitelist")
        assert res_list.status_code == 200
        assert res_list.json()["count"] >= 0

@pytest.mark.asyncio
async def test_activities():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/instagram/login", json={
            "username": "jjahrav",
            "password": "Password123!",
        })
        acc_id = res.json()["account"]["id"]

        res_act = await ac.get(f"/api/v1/instagram/accounts/{acc_id}/activities")
        assert res_act.status_code == 200
        data = res_act.json()
        assert "highlights" in data
        assert "groups" in data
        assert len(data["groups"]) > 0
        assert "date_title" in data["groups"][0]
        assert "items" in data["groups"][0]

@pytest.mark.asyncio
async def test_concurrent_unfollow_mutex():
    """Verify that per-account mutex blocks concurrent parallel unfollows."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/instagram/login", json={
            "username": "mutex_test_user",
            "password": "Password123!",
        })
        acc_id = res.json()["account"]["id"]

        # Launch 5 concurrent unfollow calls for the same account
        tasks = [
            ac.post(f"/api/v1/instagram/accounts/{acc_id}/actions/unfollow", json={
                "target_ig_pk": f"par_target_{i}",
                "target_username": f"user_par_{i}",
            })
            for i in range(5)
        ]
        responses = await asyncio.gather(*tasks)
        status_codes = [r.status_code for r in responses]

        # Exactly 1 must succeed with 200, remaining 4 must be rate limited with 429
        assert status_codes.count(200) == 1
        assert status_codes.count(429) == 4

@pytest.mark.asyncio
async def test_whitelist_unfollow_guard():
    """Verify that whitelisted accounts cannot be unfollowed directly."""
    import uuid
    unique_target = f"vip_{uuid.uuid4().hex[:6]}"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/instagram/login", json={
            "username": f"user_{uuid.uuid4().hex[:6]}",
            "password": "Password123!",
        })
        acc_id = res.json()["account"]["id"]

        # Toggle whitelist for target -> adds to whitelist
        res_toggle = await ac.post(f"/api/v1/instagram/accounts/{acc_id}/whitelist/toggle", json={
            "target_ig_pk": unique_target,
            "target_username": unique_target,
        })
        assert res_toggle.status_code == 200
        assert res_toggle.json()["is_whitelisted"] is True

        # Try to unfollow the whitelisted user -> must be blocked with 400
        res_unfoll = await ac.post(f"/api/v1/instagram/accounts/{acc_id}/actions/unfollow", json={
            "target_ig_pk": unique_target,
            "target_username": unique_target,
        })
        assert res_unfoll.status_code == 400
        detail = res_unfoll.json()["detail"]
        assert detail["status"] == "WHITELISTED"

@pytest.mark.asyncio
async def test_quota_exhaustion_blocks():
    """Verify that when remaining quota is 0, unfollow is blocked with QUOTA_EXCEEDED."""
    import uuid
    from app.db.models import InstagramAccount
    from app.db.session import AsyncSessionLocal

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/instagram/login", json={
            "username": f"quota_test_{uuid.uuid4().hex[:6]}",
            "password": "Password123!",
        })
        acc_id = res.json()["account"]["id"]

        # Artificially set used quota to limit
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            acc_db = (await db.execute(select(InstagramAccount).where(InstagramAccount.id == acc_id))).scalar_one()
            acc_db.daily_unfollow_used = 40
            await db.commit()

        # Attempt unfollow with exhausted quota
        res_blocked = await ac.post(f"/api/v1/instagram/accounts/{acc_id}/actions/unfollow", json={
            "target_ig_pk": "some_target_id",
            "target_username": "some_target",
        })
        assert res_blocked.status_code == 429
        detail = res_blocked.json()["detail"]
        assert detail["status"] == "QUOTA_EXCEEDED"
        assert detail["remaining_quota"] == 0

@pytest.mark.asyncio
async def test_account_switcher_and_active_flag():
    """Verify listing accounts and active account switcher."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/auth/instagram/accounts")
        assert res.status_code == 200
        data = res.json()
        assert "active_account_id" in data
        assert "accounts" in data
        assert len(data["accounts"]) >= 1


