"""Communications module — ORM models."""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database import Base
from app.shared.base_model import BaseEntityMixin


class CommunicationTemplate(BaseEntityMixin, Base):
    __tablename__ = "communication_templates"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    desc: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tag: Mapped[str] = mapped_column(String(100), default="Marketing", nullable=False)
    used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class CommunicationCampaign(BaseEntityMixin, Base):
    __tablename__ = "communication_campaigns"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    recipients: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    open_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    click_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class CommunicationSegment(BaseEntityMixin, Base):
    __tablename__ = "communication_segments"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    desc: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    criteria: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
