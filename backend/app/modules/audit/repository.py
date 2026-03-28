"""
Audit module — Repository layer.
Append-only. No update or delete operations.
"""

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import AuditLog


class AuditRepository:
    """Repository for audit log operations. Append-only."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, audit_log: AuditLog) -> AuditLog:
        """Create a new audit log entry."""
        self.db.add(audit_log)
        await self.db.flush()
        return audit_log

    async def get_by_entity(
        self,
        entity_type: str,
        entity_id: str,
        offset: int = 0,
        limit: int = 20,
    ) -> List[AuditLog]:
        """Get audit logs for a specific entity."""
        result = await self.db.execute(
            select(AuditLog)
            .where(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .offset(offset)
            .limit(limit)
            .order_by(AuditLog.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_actor(
        self,
        actor_id: str,
        offset: int = 0,
        limit: int = 20,
    ) -> List[AuditLog]:
        """Get audit logs by actor."""
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.actor_id == actor_id)
            .offset(offset)
            .limit(limit)
            .order_by(AuditLog.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_trace_id(self, trace_id: str) -> List[AuditLog]:
        """Get all audit logs for a specific trace/request."""
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.trace_id == trace_id)
            .order_by(AuditLog.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_filtered(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        action: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> List[AuditLog]:
        """Get audit logs with flexible filtering."""
        query = select(AuditLog)

        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.where(AuditLog.entity_id == entity_id)
        if actor_id:
            query = query.where(AuditLog.actor_id == actor_id)
        if action:
            query = query.where(AuditLog.action == action)

        query = query.offset(offset).limit(limit).order_by(AuditLog.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
