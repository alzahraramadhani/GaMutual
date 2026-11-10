from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.unfollower import router as unfollower_router
from app.api.v1.activity import router as activity_router
from app.api.v1.whitelist import router as whitelist_router

api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(unfollower_router)
api_router.include_router(activity_router)
api_router.include_router(whitelist_router)
