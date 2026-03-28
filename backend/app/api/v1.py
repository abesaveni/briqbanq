"""
API v1 router — aggregates all module routes under /api/v1 prefix.
"""

from fastapi import APIRouter

from app.modules.identity.routes import router as identity_router
from app.modules.roles.routes import router as roles_router
from app.modules.kyc.routes import router as kyc_router
from app.modules.audit.routes import router as audit_router
from app.modules.admin.routes import router as admin_router
from app.modules.admin.extra_routes import router as admin_extra_router
from app.modules.cases.routes import router as cases_router
from app.modules.documents.routes import router as documents_router

v1_router = APIRouter(prefix="/api/v1")

# Phase 1: Identity & Governance
v1_router.include_router(identity_router)
v1_router.include_router(roles_router)
v1_router.include_router(kyc_router)
v1_router.include_router(audit_router)
v1_router.include_router(admin_router)
v1_router.include_router(admin_extra_router)

# Phase 2: Case & Document System
v1_router.include_router(cases_router)
v1_router.include_router(documents_router)

# Phase 3: Deal & Auction Engine
from app.modules.deals.routes import router as deals_router
from app.modules.auctions.routes import router as auctions_router
from app.modules.bids.routes import router as bids_router
v1_router.include_router(deals_router)
v1_router.include_router(auctions_router)
v1_router.include_router(bids_router)

# Phase 4: Wallet & Escrow
from app.modules.wallet.routes import router as wallet_router
from app.modules.escrow.routes import router as escrow_router
v1_router.include_router(wallet_router)
v1_router.include_router(escrow_router)

# Wallet alias — frontend calls /wallet (singular) with different paths
from app.modules.wallet.alias_routes import router as wallet_alias_router
v1_router.include_router(wallet_alias_router)

# Phase 5: Contract & Settlement
from app.modules.contracts.routes import router as contracts_router
from app.modules.settlement.routes import router as settlement_router
v1_router.include_router(contracts_router)
v1_router.include_router(settlement_router)

# Phase 6: Notifications
from app.modules.notifications.routes import router as notifications_router
v1_router.include_router(notifications_router)

# Phase 7: New missing Modules
from app.modules.borrower.routes import router as borrower_router
from app.modules.investor.routes import router as investor_router
from app.modules.loans.routes import router as loans_router
from app.modules.users.routes import router as users_router
from app.modules.tasks.routes import router as tasks_router
from app.modules.lawyer.routes import router as lawyer_router

v1_router.include_router(borrower_router)
v1_router.include_router(investor_router)
v1_router.include_router(loans_router)
v1_router.include_router(users_router)
v1_router.include_router(tasks_router)
v1_router.include_router(lawyer_router)

# Phase 8: Platform supplemental routes
from app.modules.platform.routes import router as platform_router
v1_router.include_router(platform_router)
