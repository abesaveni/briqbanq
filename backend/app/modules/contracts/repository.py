"""Contracts module — Repository."""
import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.contracts.models import Contract, ContractSignature
from app.shared.enums import ContractStatus

class ContractRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, contract: Contract) -> Contract:
        self.db.add(contract)
        await self.db.flush()
        await self.db.refresh(contract)
        return contract

    async def get_by_id(self, contract_id: uuid.UUID) -> Optional[Contract]:
        result = await self.db.execute(select(Contract).where(Contract.id == contract_id))
        return result.scalar_one_or_none()

    async def get_by_deal(self, deal_id: uuid.UUID) -> List[Contract]:
        result = await self.db.execute(
            select(Contract).where(Contract.deal_id == deal_id).order_by(Contract.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: uuid.UUID) -> List[Contract]:
        """Get contracts related to a user (created by or participant)."""
        # For now, just created_by. In future, join with signatures.
        result = await self.db.execute(
            select(Contract).where(Contract.created_by == user_id).order_by(Contract.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, contract: Contract) -> Contract:
        await self.db.flush()
        await self.db.refresh(contract)
        return contract


class SignatureRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, signature: ContractSignature) -> ContractSignature:
        self.db.add(signature)
        await self.db.flush()
        await self.db.refresh(signature)
        return signature

    async def get_by_contract(self, contract_id: uuid.UUID) -> List[ContractSignature]:
        result = await self.db.execute(
            select(ContractSignature).where(ContractSignature.contract_id == contract_id)
        )
        return list(result.scalars().all())

    async def get_by_signer(self, contract_id: uuid.UUID, signer_id: uuid.UUID) -> Optional[ContractSignature]:
        result = await self.db.execute(
            select(ContractSignature).where(
                ContractSignature.contract_id == contract_id,
                ContractSignature.signer_id == signer_id,
            )
        )
        return result.scalar_one_or_none()

    async def update(self, sig: ContractSignature) -> ContractSignature:
        await self.db.flush()
        await self.db.refresh(sig)
        return sig
