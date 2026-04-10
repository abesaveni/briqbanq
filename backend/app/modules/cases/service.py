"""
Cases module — Service layer.
All business logic for case lifecycle management.
State machine enforcement, audit logging triggers, event emission.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.core.exceptions import (  # type: ignore
    InvalidStateTransitionError,
    ResourceNotFoundError,
    StaleDataError,
    AuthorizationError,
)
from app.modules.cases.models import Case  # type: ignore
from app.modules.cases.repository import CaseRepository  # type: ignore
from app.modules.notifications.service import NotificationService  # type: ignore
from app.modules.identity.repository import UserRepository  # type: ignore
from app.modules.documents.service import DocumentService  # type: ignore
from app.shared.enums import CaseStatus, DealStatus, RoleType  # type: ignore
from app.shared.mixins import StateMachineMixin  # type: ignore


class CaseStateMachine(StateMachineMixin):
    """
    Valid case lifecycle transitions.
    DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → LISTED → CLOSED
    """
    VALID_TRANSITIONS = {
        CaseStatus.DRAFT.value: [CaseStatus.SUBMITTED.value],
        CaseStatus.SUBMITTED.value: [CaseStatus.UNDER_REVIEW.value, CaseStatus.APPROVED.value, CaseStatus.REJECTED.value],
        CaseStatus.UNDER_REVIEW.value: [CaseStatus.APPROVED.value, CaseStatus.REJECTED.value, CaseStatus.DRAFT.value],
        CaseStatus.APPROVED.value: [CaseStatus.LISTED.value, CaseStatus.AUCTION.value],
        CaseStatus.LISTED.value: [CaseStatus.AUCTION.value, CaseStatus.CLOSED.value],
        CaseStatus.AUCTION.value: [CaseStatus.CLOSED.value, CaseStatus.FUNDED.value],
        CaseStatus.FUNDED.value: [CaseStatus.CLOSED.value],
    }


class CaseService:
    """Service layer for case management business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CaseRepository(db)

    async def create_case(
        self,
        borrower_id: uuid.UUID,
        title: str,
        description: Optional[str],
        property_address: str,
        property_type: str,
        estimated_value: Decimal,
        outstanding_debt: Decimal,
        trace_id: str,
        interest_rate: Optional[Decimal] = None,
        tenure: Optional[int] = None,
        metadata_json: Optional[dict] = None,
    ) -> Case:
        """Create a new case in DRAFT status."""
        from datetime import datetime as _dt
        import random as _random, string as _string
        _year = _dt.utcnow().year
        _suffix = ''.join(_random.choices(_string.digits, k=4))
        case_number = f"MIP-{_year}-{_suffix}"
        case = Case(
            case_number=case_number,
            title=title,
            description=description,
            property_address=property_address,
            property_type=property_type,
            estimated_value=estimated_value,
            outstanding_debt=outstanding_debt,
            interest_rate=interest_rate,
            tenure=tenure,
            status=CaseStatus.DRAFT,
            borrower_id=borrower_id,
            metadata_json=metadata_json or {},
        )
        case = await self.repository.create(case)
        return case

    async def update_case(
        self,
        case_id: uuid.UUID,
        borrower_id: uuid.UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
        property_address: Optional[str] = None,
        property_type: Optional[str] = None,
        estimated_value: Optional[Decimal] = None,
        outstanding_debt: Optional[Decimal] = None,
        interest_rate: Optional[Decimal] = None,
        tenure: Optional[int] = None,
        expected_version: Optional[int] = None,
        trace_id: str = "",
        extra_meta: Optional[dict] = None,
        metadata_json: Optional[dict] = None,
    ) -> Case:
        """
        Update case details. Only allowed in DRAFT status.
        Uses optimistic locking via version column.
        """
        case = await self._get_case_or_404(case_id)

        # Verify ownership — creator can always edit their own case
        # (borrower_id stores the creator's user_id for non-borrower created cases)
        if case.borrower_id != borrower_id:  # type: ignore[comparison-overlap]
            raise AuthorizationError(message="You can only update cases you created")

        # Always allow metadata-only updates; only restrict structural fields to DRAFT
        has_structural_changes = any(v is not None for v in [title, description, property_address, property_type, estimated_value, outstanding_debt, interest_rate, tenure])
        if has_structural_changes and case.status != CaseStatus.DRAFT:  # type: ignore[comparison-overlap]
            raise InvalidStateTransitionError(
                message=f"Case cannot be edited in {case.status.value} status"
            )

        # Optimistic locking
        if expected_version is not None and case.version != expected_version:
            raise StaleDataError()

        if title is not None:
            case.title = title  # type: ignore[assignment]
        if description is not None:
            case.description = description  # type: ignore[assignment]
        if property_address is not None:
            case.property_address = property_address  # type: ignore[assignment]
        if property_type is not None:
            case.property_type = property_type  # type: ignore[assignment]
        if estimated_value is not None:
            case.estimated_value = estimated_value  # type: ignore[assignment]
        if outstanding_debt is not None:
            case.outstanding_debt = outstanding_debt  # type: ignore[assignment]
        if interest_rate is not None:
            case.interest_rate = interest_rate  # type: ignore[assignment]
        if tenure is not None:
            case.tenure = tenure  # type: ignore[assignment]

        # Merge metadata_json (full dict) — allowed in any status
        import json as _json
        existing_meta = case.metadata_json or {}
        if isinstance(existing_meta, str):
            try:
                existing_meta = _json.loads(existing_meta)
            except Exception:
                existing_meta = {}

        if metadata_json:
            existing_meta = {**existing_meta, **metadata_json}

        # Also apply individual extra_meta fields (bedrooms, suburb, etc.)
        if extra_meta:
            existing_meta = {**existing_meta, **{k: v for k, v in extra_meta.items() if v is not None}}

        case.metadata_json = existing_meta  # type: ignore[assignment]
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(case, "metadata_json")

        case.version += 1
        return await self.repository.update(case)

    async def update_case_metadata(
        self, case_id: uuid.UUID, metadata: dict, trace_id: str
    ) -> Case:
        """Update the metadata JSON for a case."""
        case = await self._get_case_or_404(case_id)
        # Merge into existing metadata
        existing = dict(case.metadata_json or {})
        existing.update(metadata)
        case.metadata_json = existing
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(case, "metadata_json")
        case.version += 1
        return await self.repository.update(case)

    async def admin_update_case(

        self,
        case_id: uuid.UUID,
        property_address: Optional[str] = None,
        property_type: Optional[str] = None,
        estimated_value: Optional[Decimal] = None,
        outstanding_debt: Optional[Decimal] = None,
        interest_rate: Optional[Decimal] = None,
        extra_meta: Optional[dict] = None,
        trace_id: str = "",
    ) -> Case:
        """Admin update — no ownership or status restriction."""
        case = await self._get_case_or_404(case_id)
        if property_address is not None:
            case.property_address = property_address
        if property_type is not None:
            case.property_type = property_type
        if estimated_value is not None:
            case.estimated_value = estimated_value
        if outstanding_debt is not None:
            case.outstanding_debt = outstanding_debt
        if interest_rate is not None:
            case.interest_rate = interest_rate
        if extra_meta:
            existing = dict(case.metadata_json or {})
            existing.update(extra_meta)
            case.metadata_json = existing
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(case, "metadata_json")
        case.version += 1
        return await self.repository.update(case)

    async def submit_case(
        self, case_id: uuid.UUID, borrower_id: uuid.UUID, trace_id: str
    ) -> Case:
        """Submit a case for review. DRAFT → SUBMITTED (awaiting admin review). Idempotent if already SUBMITTED."""
        case = await self._get_case_or_404(case_id)

        if case.borrower_id != borrower_id:  # type: ignore[comparison-overlap]
            raise AuthorizationError(message="You can only submit cases you created")

        # Idempotent: already submitted or under review → return as-is without error
        if case.status in (CaseStatus.SUBMITTED, CaseStatus.UNDER_REVIEW):  # type: ignore[comparison-overlap]
            return case

        CaseStateMachine.validate_transition(
            case.status.value, CaseStatus.SUBMITTED.value
        )

        case.status = CaseStatus.SUBMITTED  # type: ignore[assignment]
        case.rejection_reason = None  # type: ignore[assignment]  # Clear any previous rejection
        case.version += 1
        case = await self.repository.update(case)

        # Notify Admin & Borrower on submission (in-app + email)
        try:
            admin_users = await UserRepository(self.db).get_users_by_role(RoleType.ADMIN)
            notif_service = NotificationService(self.db)
            from app.infrastructure.email_service import EmailService
            from app.modules.identity.models import User
            from sqlalchemy import select as sa_select
            borrower_row = await self.db.execute(sa_select(User).where(User.id == borrower_id))
            borrower = borrower_row.scalar_one_or_none()
            borrower_name = f"{borrower.first_name} {borrower.last_name}".strip() if borrower else "Borrower"
            for admin in admin_users:
                await notif_service.create_notification(
                    user_id=admin.id,
                    title="New Case Submitted",
                    message=f"A new case '{case.title}' has been submitted and is ready for review.",
                    entity_type="case",
                    entity_id=str(case.id),
                    trace_id=trace_id
                )
                await EmailService.send_case_submitted_email(
                    to_email=admin.email,
                    admin_name=f"{admin.first_name} {admin.last_name}".strip() or "Admin",
                    case_title=case.title,
                    borrower_name=borrower_name,
                    property_address=case.property_address,
                    case_number=case.case_number or "",
                )

            await notif_service.create_notification(
                user_id=borrower_id,
                title="Case Submitted for Review",
                message="Your case has been submitted and is now under review. You will be notified once a decision is made.",
                entity_type="case",
                entity_id=str(case.id),
                trace_id=trace_id
            )
        except Exception as e:
            print(f"Failed to send submission notifications: {e}")

        return case

    async def start_review(
        self, case_id: uuid.UUID, reviewer_id: uuid.UUID, trace_id: str
    ) -> Case:
        """Start reviewing a submitted case. SUBMITTED → UNDER_REVIEW."""
        case = await self._get_case_or_404(case_id)

        CaseStateMachine.validate_transition(
            case.status.value, CaseStatus.UNDER_REVIEW.value
        )

        case.status = CaseStatus.UNDER_REVIEW  # type: ignore[assignment]
        case.reviewed_by = reviewer_id  # type: ignore[assignment]
        case.version += 1
        return await self.repository.update(case)

    async def approve_case(
        self, case_id: uuid.UUID, reviewer_id: uuid.UUID, trace_id: str
    ) -> Case:
        """Approve a case under review. UNDER_REVIEW → APPROVED."""
        case = await self._get_case_or_404(case_id)

        CaseStateMachine.validate_transition(
            case.status.value, CaseStatus.APPROVED.value
        )

        case.status = CaseStatus.APPROVED  # type: ignore[assignment]
        case.reviewed_by = reviewer_id  # type: ignore[assignment]
        case.approved_at = datetime.utcnow()  # type: ignore[assignment]
        case.deal_status = DealStatus.LISTED  # type: ignore[assignment]  # Default to LISTED (LIVE)
        case.version += 1
        case = await self.repository.update(case)

        # Notify Borrower (in-app + email)
        try:
            notif_service = NotificationService(self.db)
            await notif_service.create_notification(
                user_id=case.borrower_id,  # type: ignore[arg-type]
                title="Case Approved",
                message=f"Your case '{case.title}' has been approved.",
                entity_type="case",
                entity_id=str(case.id),
                trace_id=trace_id
            )
            from app.infrastructure.email_service import EmailService
            from app.modules.identity.models import User
            from sqlalchemy import select as sa_select
            borrower_row = await self.db.execute(sa_select(User).where(User.id == case.borrower_id))
            borrower = borrower_row.scalar_one_or_none()
            if borrower:
                await EmailService.send_case_approved_email(
                    to_email=borrower.email,
                    borrower_name=f"{borrower.first_name} {borrower.last_name}".strip() or borrower.email,
                    case_number=case.case_number or str(case.id)[:8].upper(),
                    property_address=case.property_address,
                )
        except Exception as e:
            print(f"Failed to send case approval notifications: {e}")

        return case

    async def reject_case(
        self,
        case_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        reason: Optional[str],
        trace_id: str,
    ) -> Case:
        """
        Reject a case and allow resubmission.
        UNDER_REVIEW → DRAFT (with rejection_reason set).
        The borrower can then update and resubmit.
        """
        case = await self._get_case_or_404(case_id)

        # Rejection sends back to DRAFT (borrower sees rejection and can fix)
        if case.status != CaseStatus.UNDER_REVIEW:  # type: ignore[comparison-overlap]
            raise InvalidStateTransitionError(
                message=f"Case must be UNDER_REVIEW to reject, currently {case.status.value}"
            )

        case.status = CaseStatus.REJECTED  # type: ignore[assignment]
        case.reviewed_by = reviewer_id  # type: ignore[assignment]
        case.rejection_reason = reason  # type: ignore[assignment]
        case.version += 1
        case = await self.repository.update(case)

        # Notify Borrower (in-app + email)
        try:
            notif_service = NotificationService(self.db)
            await notif_service.create_notification(
                user_id=case.borrower_id,  # type: ignore[arg-type]
                title="Case Requires Updates",
                message=f"Your case '{case.title}' requires updates before it can be approved." + (f" Reason: {reason}" if reason else ""),
                entity_type="case",
                entity_id=str(case.id),
                trace_id=trace_id
            )
            from app.infrastructure.email_service import EmailService
            from app.modules.identity.models import User
            from sqlalchemy import select as sa_select
            borrower_row = await self.db.execute(sa_select(User).where(User.id == case.borrower_id))
            borrower = borrower_row.scalar_one_or_none()
            if borrower:
                await EmailService.send_case_rejected_email(
                    to_email=borrower.email,
                    borrower_name=f"{borrower.first_name} {borrower.last_name}".strip() or borrower.email,
                    case_title=case.title,
                    reason=reason or "",
                )
        except Exception as e:
            print(f"Failed to send case rejection notifications: {e}")

        return case

    async def list_case(
        self, case_id: uuid.UUID, admin_id: uuid.UUID, trace_id: str
    ) -> Case:
        """List an approved case for auction. APPROVED → LISTED."""
        case = await self._get_case_or_404(case_id)

        CaseStateMachine.validate_transition(
            case.status.value, CaseStatus.LISTED.value
        )

        case.status = CaseStatus.LISTED  # type: ignore[assignment]
        case.version += 1
        return await self.repository.update(case)

    async def close_case(
        self, case_id: uuid.UUID, admin_id: uuid.UUID, trace_id: str
    ) -> Case:
        """Close a listed case. LISTED → CLOSED."""
        case = await self._get_case_or_404(case_id)

        CaseStateMachine.validate_transition(
            case.status.value, CaseStatus.CLOSED.value
        )

        case.status = CaseStatus.CLOSED  # type: ignore[assignment]
        case.version += 1
        return await self.repository.update(case)

    async def assign_participants(
        self,
        case_id: uuid.UUID,
        lawyer_id: Optional[uuid.UUID] = None,
        lender_id: Optional[uuid.UUID] = None,
        trace_id: str = "",
    ) -> Case:
        """Assign a lawyer and/or lender to a case."""
        case = await self._get_case_or_404(case_id)

        if lawyer_id:
            case.assigned_lawyer_id = lawyer_id  # type: ignore[assignment]
        if lender_id:
            case.assigned_lender_id = lender_id  # type: ignore[assignment]

        case.version += 1
        return await self.repository.update(case)

    async def get_case(self, case_id: uuid.UUID) -> Case:
        """Get a case by ID."""
        return await self._get_case_or_404(case_id)

    async def update_case_status(
        self, case_id: uuid.UUID, new_status: str, admin_id: uuid.UUID, trace_id: str
    ) -> Case:
        """Update case status (override or progress)."""
        case = await self._get_case_or_404(case_id)
        
        old_status = case.status.value
        
        # Map friendly names to enums
        status_mapping = {
            "Pending": CaseStatus.SUBMITTED,
            "Active": CaseStatus.LISTED,
            "In Auction": CaseStatus.AUCTION,
            "Completed": CaseStatus.CLOSED,
            "Rejected": CaseStatus.REJECTED,
        }
        
        if new_status in status_mapping:
            new_status_enum = status_mapping[new_status]
        else:
            new_status_enum = CaseStatus(new_status)
            
        case.status = new_status_enum
        new_status = new_status_enum.value # Use internal value for logic below
        
        # Update deal status if case moves to certain stages
        if new_status == CaseStatus.LISTED.value or new_status == CaseStatus.AUCTION.value:
            from app.modules.deals.service import DealService
            deal_service = DealService(self.db)
            existing_deal = await deal_service.repository.get_by_case_id(case_id)
            if not existing_deal:
                await deal_service.create_deal(
                    case_id=case_id,
                    title=case.title,
                    description=case.description,
                    asking_price=case.estimated_value,
                    reserve_price=None,
                    seller_id=case.borrower_id,
                    created_by=admin_id,
                    trace_id=trace_id
                )
            else:
                existing_deal.status = DealStatus.LISTED
                await deal_service.repository.update(existing_deal)
            
            # If status is AUCTION, ensure an Auction record exists
            if new_status == CaseStatus.AUCTION.value:
                from app.modules.auctions.service import AuctionService
                from app.shared.enums import AuctionStatus
                from datetime import timedelta, timezone
                
                auction_service = AuctionService(self.db)
                # Use current deal (either newly created above or existing)
                deal_id = existing_deal.id if existing_deal else (await deal_service.repository.get_by_case_id(case_id)).id
                
                existing_auctions = await auction_service.repository.get_by_deal_id(deal_id)
                if not existing_auctions:
                    now = datetime.now(timezone.utc)
                    new_auction = await auction_service.create_auction(
                        deal_id=deal_id,
                        title=f"Auction for {case.title}",
                        starting_price=case.estimated_value,
                        minimum_increment=Decimal("100.00"),
                        scheduled_start=now,
                        scheduled_end=now + timedelta(days=7),
                        created_by=admin_id,
                        trace_id=trace_id
                    )
                    # Auto-start the auction so it is immediately LIVE
                    await auction_service.start_auction(new_auction.id, trace_id)
                else:
                    # If auction exists but is still SCHEDULED, start it
                    auction = existing_auctions[0]
                    if auction.status == AuctionStatus.SCHEDULED:
                        await auction_service.start_auction(auction.id, trace_id)
        elif new_status == CaseStatus.CLOSED.value:
            from app.modules.deals.service import DealService
            deal_service = DealService(self.db)
            existing_deal = await deal_service.repository.get_by_case_id(case_id)
            if existing_deal:
                existing_deal.status = DealStatus.CLOSED
                await deal_service.repository.update(existing_deal)
            
        case.version += 1
        case = await self.repository.update(case)

        # Notify Borrower
        if old_status != new_status:
            try:
                notif_service = NotificationService(self.db)
                
                messages = {
                    CaseStatus.SUBMITTED.value: "Your case is pending review.",
                    CaseStatus.LISTED.value: "Your case is active.",
                    CaseStatus.AUCTION.value: "Your case is in auction.",
                    CaseStatus.CLOSED.value: "Your case has been completed.",
                    CaseStatus.REJECTED.value: "Your case has been rejected.",
                }
                
                message = messages.get(new_status, f"Your case status has been updated to {new_status}.")
                
                await notif_service.create_notification(
                    user_id=case.borrower_id,  # type: ignore[arg-type]
                    title="Case Update",
                    message=message,
                    entity_type="case",
                    entity_id=str(case.id),
                    trace_id=trace_id
                )
            except Exception as e:
                print(f"Failed to send borrower notification: {e}")

        return case

    async def delete_case(self, case_id: uuid.UUID, admin_id: uuid.UUID, trace_id: str) -> None:
        """Delete a case and ALL related records using raw SQL to bypass FK constraints."""
        case = await self._get_case_or_404(case_id)
        from sqlalchemy import text
        db = self.repository.db
        cid = str(case_id)
        # Step 1: delete bids → auctions (via deals chain)
        await db.execute(text(
            "DELETE FROM bids WHERE auction_id IN "
            "(SELECT id FROM auctions WHERE deal_id IN "
            "(SELECT id FROM deals WHERE case_id = :cid))"
        ), {"cid": cid})
        # Step 2: delete auctions via deals
        await db.execute(text(
            "DELETE FROM auctions WHERE deal_id IN "
            "(SELECT id FROM deals WHERE case_id = :cid)"
        ), {"cid": cid})
        # Step 3: delete tables with direct case_id FK
        for table in ["contracts", "escrow_accounts", "case_messages", "case_activity", "documents", "case_images", "deals"]:
            try:
                await db.execute(text(f"DELETE FROM {table} WHERE case_id = :cid"), {"cid": cid})
            except Exception:
                pass
        await db.flush()
        await self.repository.delete(case)


    async def get_live_cases(self) -> list:
        """Return all cases with LISTED or AUCTION status, including auction_status via Deal→Auction join."""
        from sqlalchemy import select
        from app.modules.cases.models import Case
        from app.modules.deals.models import Deal
        from app.modules.auctions.models import Auction as AuctionModel
        result = await self.repository.db.execute(
            select(Case, AuctionModel.status.label("auction_status"), AuctionModel.scheduled_end.label("auction_scheduled_end"))
            .outerjoin(Deal, Deal.case_id == Case.id)
            .outerjoin(AuctionModel, AuctionModel.deal_id == Deal.id)
            .where(Case.status.in_([CaseStatus.LISTED, CaseStatus.AUCTION, CaseStatus.FUNDED, CaseStatus.CLOSED]))
            .order_by(Case.created_at.desc())
        )
        rows = result.all()
        # Attach auction_status and auction_scheduled_end onto each Case object for serialization
        enriched = []
        seen = set()
        for row in rows:
            case = row[0]
            auction_status = row[1]
            auction_scheduled_end = row[2]
            if case.id in seen:
                continue
            seen.add(case.id)
            case._auction_status = auction_status.value if auction_status else None
            case._auction_scheduled_end = auction_scheduled_end.isoformat() if auction_scheduled_end else None
            enriched.append(case)
        return enriched

    async def get_borrower_cases(
        self,
        borrower_id: uuid.UUID,
        status: Optional[CaseStatus] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> List[Case]:
        """Get all cases for a borrower."""
        return await self.repository.get_by_borrower(
            borrower_id, status, offset, limit
        )

    async def get_all_cases(
        self,
        status: Optional[CaseStatus] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[List[Case], int]:
        """Get all cases with count."""
        cases = await self.repository.get_all(status, offset, limit)
        total = await self.repository.count(status)
        return cases, total

    async def get_cases_for_review(
        self, offset: int = 0, limit: int = 20
    ) -> List[Case]:
        """Get submitted cases awaiting review."""
        return await self.repository.get_for_review(offset, limit)

    async def _get_case_or_404(self, case_id: uuid.UUID) -> Case:
        """Get case or raise not found."""
        case = await self.repository.get_by_id(case_id)
        if not case:
            raise ResourceNotFoundError(message="Case not found")
        return case
