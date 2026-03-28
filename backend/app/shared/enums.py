"""
Shared enums for all domain state machines.
All states must be defined here — never inline string states.
"""

import enum


class UserStatus(str, enum.Enum):
    """User account status."""
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"


class RoleType(str, enum.Enum):
    """Available system roles."""
    BORROWER = "BORROWER"
    INVESTOR = "INVESTOR"
    LAWYER = "LAWYER"
    LENDER = "LENDER"
    ADMIN = "ADMIN"


class RoleStatus(str, enum.Enum):
    """Role assignment approval status."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVOKED = "REVOKED"


class KYCStatus(str, enum.Enum):
    """KYC verification status."""
    NOT_SUBMITTED = "NOT_SUBMITTED"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CaseStatus(str, enum.Enum):
    """Case lifecycle states."""
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    VERIFIED = "VERIFIED"
    LISTED = "LISTED"
    AUCTION = "AUCTION"
    FUNDED = "FUNDED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"


class DocumentStatus(str, enum.Enum):
    """Document verification status."""
    UPLOADED = "UPLOADED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DealStatus(str, enum.Enum):
    """Deal lifecycle states."""
    DRAFT = "DRAFT"
    LISTED = "LISTED"
    UNDER_CONTRACT = "UNDER_CONTRACT"
    SETTLED = "SETTLED"
    CLOSED = "CLOSED"


class AuctionStatus(str, enum.Enum):
    """Auction lifecycle states."""
    SCHEDULED = "SCHEDULED"
    LIVE = "LIVE"
    PAUSED = "PAUSED"
    ENDED = "ENDED"


class BidStatus(str, enum.Enum):
    """Bid status."""
    ACTIVE = "ACTIVE"
    OUTBID = "OUTBID"
    WINNING = "WINNING"
    WON = "WON"
    LOST = "LOST"
    DEFAULTED = "DEFAULTED"


class WalletType(str, enum.Enum):
    """Wallet types."""
    USER = "USER"
    ESCROW = "ESCROW"
    PLATFORM = "PLATFORM"


class LedgerEntryType(str, enum.Enum):
    """Ledger entry types for double-entry bookkeeping."""
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class LedgerTransactionType(str, enum.Enum):
    """Types of financial transactions."""
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    BID_LOCK = "BID_LOCK"
    BID_RELEASE = "BID_RELEASE"
    ESCROW_HOLD = "ESCROW_HOLD"
    ESCROW_RELEASE = "ESCROW_RELEASE"
    SETTLEMENT = "SETTLEMENT"
    FEE = "FEE"
    REFUND = "REFUND"


class EscrowStatus(str, enum.Enum):
    """Escrow status."""
    PENDING = "PENDING"
    HELD = "HELD"
    RELEASED = "RELEASED"
    REFUNDED = "REFUNDED"


class EscrowMode(str, enum.Enum):
    """Escrow processing modes."""
    INTERNAL = "INTERNAL"
    EXTERNAL = "EXTERNAL"


class ContractStatus(str, enum.Enum):
    """Contract lifecycle."""
    DRAFT = "DRAFT"
    PENDING_SIGNATURES = "PENDING_SIGNATURES"
    PARTIALLY_SIGNED = "PARTIALLY_SIGNED"
    FULLY_SIGNED = "FULLY_SIGNED"
    EXECUTED = "EXECUTED"
    CANCELLED = "CANCELLED"


class SettlementStatus(str, enum.Enum):
    """Settlement status."""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class NotificationType(str, enum.Enum):
    """Notification types."""
    EMAIL = "EMAIL"
    SMS = "SMS"
    IN_APP = "IN_APP"
    PUSH = "PUSH"


class NotificationPriority(str, enum.Enum):
    """Notification priority levels."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TaskStatus(str, enum.Enum):
    """Task lifecycle states."""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    OVERDUE = "OVERDUE"
    COMPLETED = "COMPLETED"


class TaskPriority(str, enum.Enum):
    """Task priority levels."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"
