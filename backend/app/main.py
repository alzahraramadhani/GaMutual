import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.core.config import settings
from app.db.session import init_db, AsyncSessionLocal
from app.db.models import InstagramAccount
from app.core.security import encrypt_data
from app.core.anti_ban import get_next_wib_midnight
from app.services.sync_service import sync_service
from app.api.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gamutual")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables
    logger.info("Initializing database...")
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down GaMutual API...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="GaMutual Instagram Mutual & Unfollower Tracker Backend REST API",
    lifespan=lifespan,
)

# Enable CORS for frontend integration (supports localhost & Vercel deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root():
    return {
        "app": "GaMutual Backend API",
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
    }
