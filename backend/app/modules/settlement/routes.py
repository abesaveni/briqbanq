"""Settlement module — Routes."""
import uuid
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.settlement.policies import SettlementPolicy
from app.modules.settlement.schemas import SettlementCreateRequest, SettlementResponse, SettlementUpdateRequest
from app.modules.settlement.service import SettlementService

router = APIRouter(prefix="/settlements", tags=["Settlements"])


@router.patch("/{settlement_id}/breakdown", response_model=SettlementResponse)
async def update_settlement_breakdown(
    settlement_id: uuid.UUID,
    request: SettlementUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    SettlementPolicy.can_manage_settlement(current_user)
    service = SettlementService(db)
    return await service.update_settlement_breakdown(
        settlement_id, request.breakdown, trace_id
    )


@router.post("/", response_model=SettlementResponse, status_code=201)

async def create_settlement(
    request: SettlementCreateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    SettlementPolicy.can_manage_settlement(current_user)
    service = SettlementService(db)
    settlement = await service.create_settlement(
        deal_id=request.deal_id, contract_id=request.contract_id,
        escrow_id=request.escrow_id, buyer_id=request.buyer_id,
        seller_id=request.seller_id, total_amount=request.total_amount,
        platform_fee=request.platform_fee, trace_id=trace_id,
    )
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="settlement", entity_id=str(settlement.id),
        action="CREATE_SETTLEMENT", before_state=None,
        after_state={"status": "PENDING", "amount": str(request.total_amount)},
        trace_id=trace_id,
    )
    try:
        from app.infrastructure.email_service import EmailService
        from app.modules.identity.repository import UserRepository
        repo = UserRepository(db)
        amount_str = f"${float(request.total_amount):,.2f}"
        deal_ref = str(request.deal_id)[:8].upper()
        for uid in {request.buyer_id, request.seller_id}:
            user = await repo.get_by_id(uid)
            if user:
                await EmailService.send_settlement_created_email(
                    to_email=user.email,
                    name=user.full_name or user.email,
                    amount=amount_str,
                    deal_ref=deal_ref,
                )
    except Exception:
        pass
    return settlement


@router.post("/{settlement_id}/process", response_model=SettlementResponse)
async def process_settlement(
    settlement_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    SettlementPolicy.can_manage_settlement(current_user)
    service = SettlementService(db)
    settlement = await service.process_settlement(settlement_id, trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="settlement", entity_id=str(settlement_id),
        action="PROCESS_SETTLEMENT", before_state={"status": "PENDING"},
        after_state={"status": settlement.status.value}, trace_id=trace_id,
    )
    if settlement.status.value == "COMPLETED":
        try:
            from app.infrastructure.email_service import EmailService
            from app.modules.identity.repository import UserRepository
            repo = UserRepository(db)
            amount_str = f"${float(settlement.net_amount):,.2f}"
            deal_ref = str(settlement.deal_id)[:8].upper()
            for uid in {settlement.buyer_id, settlement.seller_id}:
                user = await repo.get_by_id(uid)
                if user:
                    await EmailService.send_settlement_completed_email(
                        to_email=user.email,
                        name=user.full_name or user.email,
                        amount=amount_str,
                        deal_ref=deal_ref,
                    )
        except Exception:
            pass
    return settlement


@router.get("/deal/{deal_id}", response_model=SettlementResponse)
async def get_deal_settlement(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = SettlementService(db)
    settlement = await service.get_deal_settlement(deal_id)
    if not settlement:
        from app.core.exceptions import ResourceNotFoundError
        raise ResourceNotFoundError(message="Settlement not found for this deal")
    return settlement


@router.get("/", response_model=list[SettlementResponse])
async def list_settlements(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    SettlementPolicy.can_manage_settlement(current_user)
    service = SettlementService(db)
    offset = (page - 1) * page_size
    return await service.get_all_settlements(offset, page_size)


@router.get("/{settlement_id}", response_model=SettlementResponse)
async def get_settlement(
    settlement_id: uuid.UUID,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = SettlementService(db)
    return await service.get_settlement(settlement_id)
