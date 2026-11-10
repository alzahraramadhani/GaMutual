import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    Text,
    DateTime,
    Date,
    ForeignKey,
    JSON,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class InstagramAccount(Base):
    __tablename__ = "instagram_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    ig_pk: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    profile_pic_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    follower_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    encrypted_session_data: Mapped[str] = mapped_column(Text, nullable=False)
    encrypted_password: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    device_settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")  # ACTIVE, CHALLENGE_REQUIRED, EXPIRED
    daily_unfollow_quota: Mapped[int] = mapped_column(Integer, default=40)
    daily_unfollow_used: Mapped[int] = mapped_column(Integer, default=0)
    quota_reset_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    remember_device: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    snapshots = relationship("IGSnapshot", back_populates="account", cascade="all, delete-orphan")
    relationships = relationship("IGRelationship", back_populates="account", cascade="all, delete-orphan")
    events = relationship("IGEvent", back_populates="account", cascade="all, delete-orphan")
    whitelist = relationship("IGWhitelist", back_populates="account", cascade="all, delete-orphan")
    unfollow_logs = relationship("UnfollowLog", back_populates="account", cascade="all, delete-orphan")

class IGSnapshot(Base):
    __tablename__ = "ig_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    ig_account_id: Mapped[str] = mapped_column(String(36), ForeignKey("instagram_accounts.id", ondelete="CASCADE"), nullable=False)
    follower_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    new_followers_count: Mapped[int] = mapped_column(Integer, default=0)
    unfollowers_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    account = relationship("InstagramAccount", back_populates="snapshots")

class IGRelationship(Base):
    __tablename__ = "ig_relationships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    ig_account_id: Mapped[str] = mapped_column(String(36), ForeignKey("instagram_accounts.id", ondelete="CASCADE"), nullable=False)
    target_ig_pk: Mapped[str] = mapped_column(String(64), nullable=False)
    target_username: Mapped[str] = mapped_column(String(100), nullable=False)
    target_full_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    target_pic_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_follower: Mapped[bool] = mapped_column(Boolean, default=False)
    is_following: Mapped[bool] = mapped_column(Boolean, default=False)
    is_mutual: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_whitelisted: Mapped[bool] = mapped_column(Boolean, default=False)
    last_checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("ig_account_id", "target_ig_pk", name="uq_account_target"),
        Index("idx_rel_search", "ig_account_id", "target_username", "target_full_name"),
    )

    account = relationship("InstagramAccount", back_populates="relationships")

class IGEvent(Base):
    __tablename__ = "ig_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    ig_account_id: Mapped[str] = mapped_column(String(36), ForeignKey("instagram_accounts.id", ondelete="CASCADE"), nullable=False)
    target_ig_pk: Mapped[str] = mapped_column(String(64), nullable=False)
    target_username: Mapped[str] = mapped_column(String(100), nullable=False)
    target_full_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    target_pic_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'UNFOLLOWED_YOU', 'NEW_FOLLOWER', 'YOU_UNFOLLOWED'
    event_date: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("idx_events_grouping", "ig_account_id", "event_date", "created_at"),
        Index("idx_events_type", "ig_account_id", "event_type"),
    )

    account = relationship("InstagramAccount", back_populates="events")

class IGWhitelist(Base):
    __tablename__ = "ig_whitelist"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    ig_account_id: Mapped[str] = mapped_column(String(36), ForeignKey("instagram_accounts.id", ondelete="CASCADE"), nullable=False)
    target_ig_pk: Mapped[str] = mapped_column(String(64), nullable=False)
    target_username: Mapped[str] = mapped_column(String(100), nullable=False)
    target_full_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    target_pic_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(String(255), default="Akun Terlindungi")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("ig_account_id", "target_ig_pk", name="uq_whitelist_target"),
    )

    account = relationship("InstagramAccount", back_populates="whitelist")

class UnfollowLog(Base):
    __tablename__ = "unfollow_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    ig_account_id: Mapped[str] = mapped_column(String(36), ForeignKey("instagram_accounts.id", ondelete="CASCADE"), nullable=False)
    target_ig_pk: Mapped[str] = mapped_column(String(64), nullable=False)
    target_username: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # 'SUCCESS', 'FAILED', 'COOLDOWN_BLOCKED'
    cooldown_applied_seconds: Mapped[int] = mapped_column(Integer, default=10)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("idx_unfollow_audit", "ig_account_id", "executed_at"),
    )

    account = relationship("InstagramAccount", back_populates="unfollow_logs")
