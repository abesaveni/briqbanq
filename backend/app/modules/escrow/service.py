"""
Escrow module — Service layer.
Supports INTERNAL (platform-managed) and EXTERNAL modes.
Mode controlled via platform_settings — no hardcoded logic.
"""
import uuid
from decimal import Decimal
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EscrowError, ResourceNotFoundError
from app.modules.escrow.models import Escrow
from app.modules.escrow.repository import EscrowRepository
from app.shared.enums import EscrowMode, EscrowStatus


class EscrowService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = EscrowRepository(db)

    async def _get_escrow_mode(self) -> EscrowMode:
        """Read escrow mode from platform settings at runtime."""
        from app.modules.admin.service import AdminService
        admin_service = AdminService(self.db)
        try:
            mode_value = await admin_service.get_setting("escrow_mode")
            return EscrowMode(mode_value)
        except Exception:
            return EscrowMode.INTERNAL  # Default fallback

    async def create_escrow(
        self,
        deal_id: uuid.UUID,
        payer_id: uuid.UUID,
        payee_id: uuid.UUID,
        amount: Decimal,
        escrow_wallet_id: Optional[uuid.UUID] = None,
        trace_id: str = "",
    ) -> Escrow:
        mode = await self._get_escrow_mode()
        escrow = Escrow(
            deal_id=deal_id,
            payer_id=payer_id,
            payee_id=payee_id,
            amount=amount,
            status=EscrowStatus.PENDING,
            mode=mode,
            escrow_wallet_id=escrow_wallet_id,
        )
        return await self.repository.create(escrow)

    async def hold_escrow(self, escrow_id: uuid.UUID, trace_id: str) -> Escrow:
        """PENDING → HELD. For INTERNAL mode, funds are locked in escrow wallet."""
        escrow = await self._get_or_404(escrow_id)
        if escrow.status.value != EscrowStatus.PENDING.value:  # type: ignore[attr-defined]
            raise EscrowError(message=f"Cannot hold escrow in {escrow.status.value} state")

        if escrow.mode.value == EscrowMode.INTERNAL.value and escrow.escrow_wallet_id:  # type: ignore[attr-defined]
            from app.modules.wallet.service import WalletService
            wallet_service = WalletService(self.db)
            payer_wallet = await wallet_service.get_user_wallet(escrow.payer_id)  # type: ignore[arg-type]
            await wallet_service.transfer(
                from_wallet_id=payer_wallet.id,
                to_wallet_id=escrow.escrow_wallet_id,  # type: ignore[arg-type]
                amount=escrow.amount,  # type: ignore[arg-type]
                transaction_type=LedgerTransactionType.ESCROW_HOLD,  # type: ignore[arg-type]
                reference_id=str(escrow.id),
                reference_type="escrow",
                description="Escrow hold",
                trace_id=trace_id,
            )

        escrow.status = EscrowStatus.HELD  # type: ignore[assignment]
        escrow.version += 1
        return await self.repository.update(escrow)

    async def release_escrow(
        self, escrow_id: uuid.UUID, reason: Optional[str] = None, trace_id: str = ""
    ) -> Escrow:
        """HELD → RELEASED. Funds transferred to payee."""
        escrow = await self._get_or_404(escrow_id)
        if escrow.status.value != EscrowStatus.HELD.value:  # type: ignore[attr-defined]
            raise EscrowError(message=f"Cannot release escrow in {escrow.status.value} state")

        if escrow.mode.value == EscrowMode.INTERNAL.value and escrow.escrow_wallet_id:  # type: ignore[attr-defined]
            from app.modules.wallet.service import WalletService
            wallet_service = WalletService(self.db)
            payee_wallet = await wallet_service.get_user_wallet(escrow.payee_id)  # type: ignore[arg-type]
            await wallet_service.transfer(
                from_wallet_id=escrow.escrow_wallet_id,  # type: ignore[arg-type]
                to_wallet_id=payee_wallet.id,
                amount=escrow.amount,  # type: ignore[arg-type]
                transaction_type=LedgerTransactionType.ESCROW_RELEASE,  # type: ignore[arg-type]
                reference_id=str(escrow.id),
                reference_type="escrow",
                description="Escrow release to payee",
                trace_id=trace_id,
            )

        escrow.status = EscrowStatus.RELEASED  # type: ignore[assignment]
        escrow.release_reason = reason or "Settlement completed"  # type: ignore[assignment]
        escrow.version += 1
        return await self.repository.update(escrow)

    async def refund_escrow(
        self, escrow_id: uuid.UUID, reason: Optional[str] = None, trace_id: str = ""
    ) -> Escrow:
        """HELD → REFUNDED. Funds returned to payer."""
        escrow = await self._get_or_404(escrow_id)
        if escrow.status.value != EscrowStatus.HELD.value:  # type: ignore[attr-defined]
            raise EscrowError(message=f"Cannot refund escrow in {escrow.status.value} state")

        if escrow.mode.value == EscrowMode.INTERNAL.value and escrow.escrow_wallet_id:  # type: ignore[attr-defined]
            from app.modules.wallet.service import WalletService
            wallet_service = WalletService(self.db)
            payer_wallet = await wallet_service.get_user_wallet(escrow.payer_id)  # type: ignore[arg-type]
            await wallet_service.transfer(
                from_wallet_id=escrow.escrow_wallet_id,  # type: ignore[arg-type]
                to_wallet_id=payer_wallet.id,
                amount=escrow.amount,  # type: ignore[arg-type]
                transaction_type=LedgerTransactionType.REFUND,  # type: ignore[arg-type]
                reference_id=str(escrow.id),
                reference_type="escrow",
                description="Escrow refund to payer",
                trace_id=trace_id,
            )

        escrow.status = EscrowStatus.REFUNDED  # type: ignore[assignment]
        escrow.release_reason = reason or "Refund"  # type: ignore[assignment]
        escrow.version += 1
        return await self.repository.update(escrow)

    async def get_escrow(self, escrow_id: uuid.UUID) -> Escrow:
        return await self._get_or_404(escrow_id)

    async def get_user_escrows(self, user_id: uuid.UUID) -> List[Escrow]:
        return await self.repository.get_by_user(user_id)

    async def get_deal_escrows(self, deal_id: uuid.UUID):
        return await self.repository.get_by_deal(deal_id)

    async def _get_or_404(self, escrow_id: uuid.UUID) -> Escrow:
        escrow = await self.repository.get_by_id(escrow_id)
        if not escrow:
            raise ResourceNotFoundError(message="Escrow not found")
        return escrow
