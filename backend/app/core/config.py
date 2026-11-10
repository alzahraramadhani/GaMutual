import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "GaMutual Backend API"
    VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./gamutual.db"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "gamutual-super-secret-key-change-in-prod-aes256gcm")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # Anti-ban rules
    DEFAULT_DAILY_QUOTA: int = 40
    MIN_COOLDOWN_SECONDS: int = 8
    MAX_COOLDOWN_SECONDS: int = 15
    
    # Proxy & Mode
    INSTAGRAM_PROXY: str | None = os.getenv("INSTAGRAM_PROXY", None)
    MOCK_IG_MODE: bool = os.getenv("MOCK_IG_MODE", "true").lower() in ("true", "1")

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
