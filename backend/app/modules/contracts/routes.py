"""Contracts module — Routes."""
import uuid
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.contracts.policies import ContractPolicy
from app.modules.contracts.schemas import (
    ContractCreateRequest, ContractResponse, ContractSignRequest, SignatureResponse,
)
from app.modules.contracts.service import ContractService

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get("", response_model=list[ContractResponse])
async def list_my_contracts(
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = ContractService(db)
    return await service.get_user_contracts(uuid.UUID(current_user["user_id"]))


@router.post("", response_model=ContractResponse, status_code=201)
async def create_contract(
    request: ContractCreateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    ContractPolicy.can_create_contract(current_user)
    service = ContractService(db)
    contract = await service.create_contract(
        deal_id=request.deal_id, title=request.title,
        contract_type=request.contract_type, signer_ids=request.signer_ids,
        created_by=uuid.UUID(current_user["user_id"]), trace_id=trace_id,
        property_name=request.property_name,
        party_name=request.party_name,
        lender_name=request.lender_name,
        value=request.value,
    )
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="contract", entity_id=str(contract.id),
        action="CREATE_CONTRACT", before_state=None,
        after_state={"status": "DRAFT", "deal_id": str(request.deal_id)},
        trace_id=trace_id,
    )
    return contract


@router.post("/{contract_id}/send", response_model=ContractResponse)
async def send_for_signatures(
    contract_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    ContractPolicy.can_create_contract(current_user)
    service = ContractService(db)
    contract = await service.send_for_signatures(contract_id, trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="contract", entity_id=str(contract_id),
        action="SEND_FOR_SIGNATURES", before_state={"status": "DRAFT"},
        after_state={"status": "PENDING_SIGNATURES"}, trace_id=trace_id,
    )
    try:
        from app.infrastructure.email_service import EmailService
        from app.modules.identity.repository import UserRepository
        from app.modules.contracts.models import ContractSignature
        from sqlalchemy import select as sa_select
        sigs_result = await db.execute(
            sa_select(ContractSignature).where(ContractSignature.contract_id == contract_id)
        )
        sigs = sigs_result.scalars().all()
        repo = UserRepository(db)
        for sig in sigs:
            user = await repo.get_by_id(sig.signer_id)
            if user:
                await EmailService.send_contract_sent_email(
                    to_email=user.email,
                    name=user.full_name or user.email,
                    contract_title=contract.title,
                )
    except Exception:
        pass
    return contract


@router.post("/{contract_id}/sign", response_model=SignatureResponse)
async def sign_contract(
    contract_id: uuid.UUID,
    request: ContractSignRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    service = ContractService(db)
    sig = await service.sign_contract(
        contract_id, uuid.UUID(current_user["user_id"]),
        request.signature_hash, trace_id,
    )
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="contract_signature", entity_id=str(sig.id),
        action="SIGN_CONTRACT", before_state={"is_signed": "false"},
        after_state={"is_signed": "true"}, trace_id=trace_id,
    )
    return sig


@router.post("/{contract_id}/execute", response_model=ContractResponse)
async def execute_contract(
    contract_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db), trace_id: str = Depends(get_trace_id),
):
    ContractPolicy.can_execute_contract(current_user)
    service = ContractService(db)
    contract = await service.execute_contract(contract_id, trace_id)
    from app.modules.audit.service import AuditService
    await AuditService(db).log(
        actor_id=current_user["user_id"], actor_role="ADMIN",
        entity_type="contract", entity_id=str(contract_id),
        action="EXECUTE_CONTRACT", before_state={"status": "FULLY_SIGNED"},
        after_state={"status": "EXECUTED"}, trace_id=trace_id,
    )
    try:
        from app.infrastructure.email_service import EmailService
        from app.modules.identity.repository import UserRepository
        from app.modules.contracts.models import ContractSignature
        from sqlalchemy import select as sa_select
        sigs_result = await db.execute(
            sa_select(ContractSignature).where(ContractSignature.contract_id == contract_id)
        )
        sigs = sigs_result.scalars().all()
        repo = UserRepository(db)
        notified = set()
        for sig in sigs:
            if sig.signer_id not in notified:
                notified.add(sig.signer_id)
                user = await repo.get_by_id(sig.signer_id)
                if user:
                    await EmailService.send_contract_executed_email(
                        to_email=user.email,
                        name=user.full_name or user.email,
                        contract_title=contract.title,
                    )
    except Exception:
        pass
    return contract


@router.get("/deal/{deal_id}", response_model=list[ContractResponse])
async def get_deal_contracts(
    deal_id: uuid.UUID,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = ContractService(db)
    return await service.get_deal_contracts(deal_id)


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: uuid.UUID,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = ContractService(db)
    return await service.get_contract(contract_id)


@router.get("/{contract_id}/signatures", response_model=list[SignatureResponse])
async def get_signatures(
    contract_id: uuid.UUID,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    service = ContractService(db)
    return await service.get_signatures(contract_id)
