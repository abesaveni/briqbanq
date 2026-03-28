"""
Contracts module — Service layer.
Contract creation, signature management, and auto-status progression.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import InvalidStateTransitionError, ResourceNotFoundError
from app.modules.contracts.models import Contract, ContractSignature
from app.modules.contracts.repository import ContractRepository, SignatureRepository
from app.shared.enums import ContractStatus


class ContractService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.contract_repo = ContractRepository(db)
        self.signature_repo = SignatureRepository(db)

    async def create_contract(
        self,
        deal_id: Optional[uuid.UUID],
        title: str,
        contract_type: str,
        signer_ids: List[uuid.UUID],
        created_by: uuid.UUID,
        trace_id: str,
        property_name: Optional[str] = None,
        party_name: Optional[str] = None,
        lender_name: Optional[str] = None,
        value: Optional[Decimal] = None,
    ) -> Contract:
        contract = Contract(
            deal_id=deal_id,
            title=title,
            contract_type=contract_type,
            status=ContractStatus.DRAFT,
            created_by=created_by,
            property_name=property_name,
            party_name=party_name,
            lender_name=lender_name,
            value=value,
        )
        contract = await self.contract_repo.create(contract)

        # Create signature placeholders for each signer
        for signer_id in signer_ids:
            sig = ContractSignature(
                contract_id=contract.id,
                signer_id=signer_id,
                signer_role="PARTY",
            )
            await self.signature_repo.create(sig)

        return contract

    async def send_for_signatures(self, contract_id: uuid.UUID, trace_id: str) -> Contract:
        """DRAFT → PENDING_SIGNATURES."""
        contract = await self._get_or_404(contract_id)
        if contract.status.value != ContractStatus.DRAFT.value:  # type: ignore[attr-defined]
            raise InvalidStateTransitionError(
                message=f"Cannot send for signatures from {contract.status.value}"
            )
        contract.status = ContractStatus.PENDING_SIGNATURES  # type: ignore[assignment]
        contract.version += 1
        return await self.contract_repo.update(contract)

    async def sign_contract(
        self, contract_id: uuid.UUID, signer_id: uuid.UUID,
        signature_hash: str, trace_id: str,
    ) -> ContractSignature:
        """Record a signature and auto-progress to FULLY_SIGNED if all signed."""
        contract = await self._get_or_404(contract_id)
        if contract.status.value != ContractStatus.PENDING_SIGNATURES.value:  # type: ignore[attr-defined]
            raise InvalidStateTransitionError(
                message="Contract is not pending signatures"
            )

        sig = await self.signature_repo.get_by_signer(contract_id, signer_id)
        if not sig:
            raise ResourceNotFoundError(message="You are not a signer on this contract")
        if sig.is_signed == "true":  # type: ignore[comparison-overlap]
            raise InvalidStateTransitionError(message="Already signed")

        sig.is_signed = "true"  # type: ignore[assignment]
        sig.signed_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        sig.signature_hash = signature_hash  # type: ignore[assignment]
        sig.version += 1
        sig = await self.signature_repo.update(sig)

        # Check if all signatures collected
        all_sigs = await self.signature_repo.get_by_contract(contract_id)
        if all(s.is_signed == "true" for s in all_sigs):  # type: ignore[comparison-overlap]
            contract.status = ContractStatus.FULLY_SIGNED  # type: ignore[assignment]
            contract.version += 1
            await self.contract_repo.update(contract)

        return sig

    async def execute_contract(self, contract_id: uuid.UUID, trace_id: str) -> Contract:
        """FULLY_SIGNED → EXECUTED."""
        contract = await self._get_or_404(contract_id)
        if contract.status.value != ContractStatus.FULLY_SIGNED.value:  # type: ignore[attr-defined]
            raise InvalidStateTransitionError(
                message=f"Contract must be FULLY_SIGNED to execute, currently {contract.status.value}"
            )
        contract.status = ContractStatus.EXECUTED  # type: ignore[assignment]
        contract.version += 1
        return await self.contract_repo.update(contract)

    async def get_contract(self, contract_id: uuid.UUID) -> Contract:
        return await self._get_or_404(contract_id)

    async def get_user_contracts(self, user_id: uuid.UUID) -> List[Contract]:
        return await self.contract_repo.get_by_user(user_id)

    async def get_deal_contracts(self, deal_id: uuid.UUID) -> List[Contract]:
        return await self.contract_repo.get_by_deal(deal_id)

    async def get_signatures(self, contract_id: uuid.UUID) -> List[ContractSignature]:
        return await self.signature_repo.get_by_contract(contract_id)

    async def _get_or_404(self, contract_id: uuid.UUID) -> Contract:
        contract = await self.contract_repo.get_by_id(contract_id)
        if not contract:
            raise ResourceNotFoundError(message="Contract not found")
        return contract
