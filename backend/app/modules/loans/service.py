"""Loans module service."""
import uuid
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.wallet.service import WalletService

class LoanService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def repay_loan(self, borrower_id: uuid.UUID, deal_id: uuid.UUID, amount: Decimal) -> dict:
        wallet_service = WalletService(self.db)
        user_wallet = await wallet_service.get_user_wallet(borrower_id)
        
        # In a real scenario, this would debit borrower wallet and credit investor/platform wallet
        await wallet_service.withdraw(
            wallet_id=user_wallet.id,
            amount=amount,
            description=f"Loan repayment for deal {deal_id}"
        )
        
        # Mock response logic
        return {
            "installments": 1,
            "interest": 5.0,
            "remaining_balance": Decimal("10000.00") - amount,
        }
