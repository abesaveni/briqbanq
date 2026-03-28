"""
Platform module — supplemental ORM models.
Persists data that was previously stored in-memory in extra_routes.py.
Tables: case_images, deal_notes, organization_settings, platform_integrations,
        custom_form_fields, user_sessions, user_2fa_settings,
        notification_preferences, user_settings
"""

import uuid
from datetime import datetime
from typing import Optional, Any

from sqlalchemy import (
    ForeignKey, String, Text, Boolean, Index,
    Enum as SAEnum, JSON as JSONB, Uuid, DateTime,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin, ImmutableEntityMixin


# ─── Case Images ───────────────────────────────────────────────────────────────

class CaseImage(BaseEntityMixin, Base):
    """Tracks property images uploaded per case."""

    __tablename__ = "case_images"

    case_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)   # local path or S3 key
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("ix_case_images_case_id", "case_id"),
    )

    def __repr__(self) -> str:
        return f"<CaseImage(id={self.id}, case_id={self.case_id}, file={self.file_name})>"


# ─── Deal Notes ────────────────────────────────────────────────────────────────

class DealNote(BaseEntityMixin, Base):
    """Notes/comments attached to a deal."""

    __tablename__ = "deal_notes"

    deal_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    author_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    author_role: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("ix_deal_notes_deal_id", "deal_id"),
    )

    def __repr__(self) -> str:
        return f"<DealNote(id={self.id}, deal_id={self.deal_id})>"


# ─── Organization Settings ─────────────────────────────────────────────────────

class OrganizationSetting(BaseEntityMixin, Base):
    """Persisted organization settings (previously hardcoded in extra_routes)."""

    __tablename__ = "organization_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    __table_args__ = (
        Index("ix_org_settings_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<OrganizationSetting(key={self.key})>"


# ─── Platform Integrations ─────────────────────────────────────────────────────

class PlatformIntegration(BaseEntityMixin, Base):
    """Third-party API integration configuration (previously hardcoded)."""

    __tablename__ = "platform_integrations"

    integration_key: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    integration_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Disconnected", nullable=False)
    last_tested_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    test_success: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    config_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)  # field values (encrypted ideally)
    fields_schema: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)  # field labels

    def __repr__(self) -> str:
        return f"<PlatformIntegration(key={self.integration_key}, status={self.status})>"


# ─── Custom Form Fields ────────────────────────────────────────────────────────

class CustomFormField(BaseEntityMixin, Base):
    """Custom fields added to platform forms (previously in-memory _FORMS dict)."""

    __tablename__ = "custom_form_fields"

    form_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    field_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Text")
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # pre-seeded fields

    __table_args__ = (
        Index("ix_custom_form_fields_form_id", "form_id"),
    )

    def __repr__(self) -> str:
        return f"<CustomFormField(form={self.form_id}, label={self.label})>"


# ─── User Sessions ─────────────────────────────────────────────────────────────

class UserSession(BaseEntityMixin, Base):
    """Active user session tracking."""

    __tablename__ = "user_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_token: Mapped[str] = mapped_column(String(500), nullable=False, unique=True, index=True)
    device_info: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    last_active_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        Index("ix_user_sessions_user_id_active", "user_id", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<UserSession(id={self.id}, user_id={self.user_id}, active={self.is_active})>"


# ─── User 2FA Settings ─────────────────────────────────────────────────────────

class User2FASettings(BaseEntityMixin, Base):
    """Two-factor authentication settings per user."""

    __tablename__ = "user_2fa_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    method: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # TOTP, SMS, EMAIL
    totp_secret: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    backup_codes: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    enabled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<User2FASettings(user_id={self.user_id}, enabled={self.is_enabled})>"


# ─── Notification Preferences ──────────────────────────────────────────────────

class NotificationPreference(BaseEntityMixin, Base):
    """Per-user notification preference settings."""

    __tablename__ = "notification_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    email_prefs: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    push_prefs: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    sms_prefs: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    def __repr__(self) -> str:
        return f"<NotificationPreference(user_id={self.user_id})>"


# ─── User Settings ─────────────────────────────────────────────────────────────

class UserSetting(BaseEntityMixin, Base):
    """Per-user UI/application settings (theme, language, timezone, etc.)."""

    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    theme: Mapped[str] = mapped_column(String(20), default="light", nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="Australia/Melbourne", nullable=False)
    extra_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    def __repr__(self) -> str:
        return f"<UserSetting(user_id={self.user_id}, theme={self.theme})>"
