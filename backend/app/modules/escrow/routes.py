"""Escrow module — Routes."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.escrow.policies import EscrowPolicy
from app.modules.escrow.schemas import EscrowCreateRequest, EscrowResponse
from app.modules.escrow.service import EscrowService
from app.modules.identity.schemas import MessageResponse

router = APIRouter(prefix="/escrows", tags=["Escrow"])

@router.get("", response_model=EscrowResponse | None)
async def list_my_escrows(
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = EscrowService(db)
    escrows = await service.get_user_escrows(uuid.UUID(current_user["user_id"]))
    if not escrows:
        return None
    return escrows[0]

@router.post("", response_model=EscrowResponse, status_code=201)
async def create_escrow(
    request: EscrowCreateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    EscrowPolicy.can_manage_escrow(current_user)
    service = EscrowService(db)
    escrow = await service.create_escrow(
        deal_id=request.deal_id, payer_id=request.payer_id,
        payee_id=request.payee_id, amount=request.amount, trace_id=trace_id,
    )
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="escrow", entity_id=str(escrow.id),
        action="CREATE_ESCROW", before_state=None,
        after_state={"status": "PENDING", "amount": str(request.amount)},
        trace_id=trace_id,
    )
    return escrow

@router.post("/{escrow_id}/hold", response_model=EscrowResponse)
async def hold_escrow(
    escrow_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    EscrowPolicy.can_manage_escrow(current_user)
    service = EscrowService(db)
    escrow = await service.hold_escrow(escrow_id, trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="escrow", entity_id=str(escrow_id),
        action="HOLD_ESCROW", before_state={"status": "PENDING"},
        after_state={"status": "HELD"}, trace_id=trace_id,
    )
    return escrow

@router.post("/{escrow_id}/release", response_model=EscrowResponse)
async def release_escrow(
    escrow_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    EscrowPolicy.can_manage_escrow(current_user)
    service = EscrowService(db)
    escrow = await service.release_escrow(escrow_id, trace_id=trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="escrow", entity_id=str(escrow_id),
        action="RELEASE_ESCROW", before_state={"status": "HELD"},
        after_state={"status": "RELEASED"}, trace_id=trace_id,
    )
    return escrow

@router.post("/{escrow_id}/refund", response_model=EscrowResponse)
async def refund_escrow(
    escrow_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    EscrowPolicy.can_manage_escrow(current_user)
    service = EscrowService(db)
    escrow = await service.refund_escrow(escrow_id, trace_id=trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="escrow", entity_id=str(escrow_id),
        action="REFUND_ESCROW", before_state={"status": "HELD"},
        after_state={"status": "REFUNDED"}, trace_id=trace_id,
    )
    return escrow

@router.get("/deal/{deal_id}", response_model=list[EscrowResponse])
async def get_deal_escrows(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = EscrowService(db)
    return await service.get_deal_escrows(deal_id)
