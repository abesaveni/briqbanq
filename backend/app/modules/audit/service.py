"""
Audit module — Service layer.
Every state change MUST create an audit entry through this service.
"""

import json
from typing import Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import AuditLog
from app.modules.audit.repository import AuditRepository


class AuditService:
    """Service layer for audit logging."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = AuditRepository(db)

    async def log(
        self,
        actor_id: str,
        actor_role: str,
        entity_type: str,
        entity_id: str,
        action: str,
        before_state: Optional[dict],
        after_state: Optional[dict],
        trace_id: str,
    ) -> AuditLog:
        """
        Create an append-only audit log entry.
        This MUST be called for every state change in the system.
        """
        audit_entry = AuditLog(
            actor_id=actor_id,
            actor_role=actor_role,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            before_state=before_state,
            after_state=after_state,
            trace_id=trace_id,
        )

        return await self.repository.create(audit_entry)

    async def get_entity_history(
        self,
        entity_type: str,
        entity_id: str,
        offset: int = 0,
        limit: int = 20,
    ) -> List[AuditLog]:
        """Get complete audit history for an entity."""
        return await self.repository.get_by_entity(
            entity_type, entity_id, offset, limit
        )

    async def get_actor_history(
        self,
        actor_id: str,
        offset: int = 0,
        limit: int = 20,
    ) -> List[AuditLog]:
        """Get all actions performed by an actor."""
        return await self.repository.get_by_actor(actor_id, offset, limit)

    async def get_request_trail(self, trace_id: str) -> List[AuditLog]:
        """Get all audit entries for a single request/trace."""
        return await self.repository.get_by_trace_id(trace_id)

    async def get_filtered_logs(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        action: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> List[AuditLog]:
        """Get audit logs with flexible filtering."""
        return await self.repository.get_filtered(
            entity_type=entity_type,
            entity_id=entity_id,
            actor_id=actor_id,
            action=action,
            offset=offset,
            limit=limit,
        )
