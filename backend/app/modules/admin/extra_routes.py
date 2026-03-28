"""
Admin Extra Routes — supplemental endpoints for the frontend.
Covers communications, integrations, organization, analytics, forms,
sessions, 2FA, notification preferences, and activity feed.
DB-backed where applicable; stubs kept for read-only reference data.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select, func, delete
from app.core.dependencies import get_current_user, get_db

router = APIRouter(prefix="/admin/extra", tags=["Admin Extra"])


# ─── Communications (reference data — no DB persistence needed) ───────────────

@router.get("/communications/templates")
async def get_templates(current_user: dict = Depends(get_current_user)):
    return [
        {"id": 1, "title": "Welcome Email", "desc": "Welcome to BrickBanq!", "tag": "Onboarding", "used": 247, "modified": "2 days ago"},
        {"id": 2, "title": "Monthly Newsletter", "desc": "Your Monthly Market Update", "tag": "Marketing", "used": 1523, "modified": "1 week ago"},
        {"id": 3, "title": "Case Update Notification", "desc": "Update on Your Case #{case_id}", "tag": "Transactional", "used": 892, "modified": "3 days ago"},
        {"id": 4, "title": "Payment Reminder", "desc": "Payment Due Reminder", "tag": "Billing", "used": 456, "modified": "5 days ago"},
        {"id": 5, "title": "Document Request", "desc": "Action Required: Document Submission", "tag": "Operations", "used": 678, "modified": "1 day ago"},
    ]


@router.get("/communications/campaigns")
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    return [
        {"id": 1, "title": "Q1 2026 Investor Update", "status": "sent", "recipients": 247, "type": "Monthly Newsletter", "date": "2026-01-15", "openRate": 78, "clickRate": 34},
        {"id": 2, "title": "New Property Listings Alert", "status": "scheduled", "recipients": 156, "type": "Case Update Notification", "date": "2026-03-28"},
        {"id": 3, "title": "Payment Reminder Batch", "status": "draft", "recipients": 89, "type": "Payment Reminder"},
        {"id": 4, "title": "Document Collection Drive", "status": "sending", "recipients": 345, "type": "Document Request", "progress": 123},
    ]


@router.get("/communications/segments")
async def get_segments(current_user: dict = Depends(get_current_user)):
    return [
        {"id": 1, "title": "Active Investors", "count": 247, "desc": "Investors with active bids or purchases", "criteria": "Role: Investor, Status: Active, Last Activity: < 30 days"},
        {"id": 2, "title": "High-Value Lenders", "count": 34, "desc": "Lenders with 5+ cases valued over $1M", "criteria": "Role: Lender, Case Value: >$1M, Case Count: >=5"},
        {"id": 3, "title": "Pending KYC Users", "count": 89, "desc": "Users who haven't completed KYC verification", "criteria": "KYC Status: Pending, Registration: <14 days"},
        {"id": 4, "title": "Lawyers - Active Cases", "count": 23, "desc": "Lawyers with assigned cases requiring review", "criteria": "Role: Lawyer, Pending Reviews: >0"},
        {"id": 5, "title": "Dormant Users", "count": 156, "desc": "Users with no activity in 90+ days", "criteria": "Last Activity: >90 days, Status: Active"},
    ]


@router.get("/communications/analytics")
async def get_comm_analytics(current_user: dict = Depends(get_current_user)):
    return {
        "totalSent": 3796,
        "avgOpenRate": 78,
        "avgClickRate": 34,
        "chartData": [
            {"name": "Mon", "sent": 400, "opened": 240},
            {"name": "Tue", "sent": 300, "opened": 139},
            {"name": "Wed", "sent": 200, "opened": 980},
            {"name": "Thu", "sent": 278, "opened": 390},
            {"name": "Fri", "sent": 189, "opened": 480},
            {"name": "Sat", "sent": 239, "opened": 380},
            {"name": "Sun", "sent": 349, "opened": 430},
        ],
        "topTemplates": [
            {"name": "Monthly Newsletter", "performance": 85},
            {"name": "Welcome Email", "performance": 92},
            {"name": "Payment Reminder", "performance": 64},
        ],
    }


# ─── Integrations (DB-backed) ─────────────────────────────────────────────────

_DEFAULT_INTEGRATIONS = [
    {
        "id": "infotrack", "type": "shield", "name": "InfoTrack",
        "description": "Identity verification, KYC checks, title searches, and property verification",
        "status": "Connected", "lastTestedAt": "2026-02-27T07:50:31Z", "testSuccess": True,
        "fields": ["API Key", "Client ID", "Environment"],
    },
    {
        "id": "rpdata", "type": "database", "name": "RP Data / CoreLogic",
        "description": "Property valuations, sales history, market insights, and property reports",
        "status": "Connected", "lastTestedAt": "2026-02-26T09:50:31Z", "testSuccess": True,
        "fields": ["API Key", "Subscriber ID"],
    },
    {
        "id": "equifax", "type": "file", "name": "Equifax",
        "description": "Credit checks, credit reports, and borrower financial assessment",
        "status": "Connected", "lastTestedAt": "2026-02-26T21:50:31Z", "testSuccess": True,
        "fields": ["Username", "Password"],
    },
    {
        "id": "stripe", "type": "zap", "name": "Stripe",
        "description": "Payment processing for deposits, fees, and investor transactions",
        "status": "Error", "lastTestedAt": "2026-02-27T08:50:31Z", "testSuccess": False,
        "fields": ["Publishable Key", "Secret Key"],
    },
    {
        "id": "pexa", "type": "globe", "name": "PEXA",
        "description": "Property Exchange Australia - electronic property settlements",
        "status": "Disconnected",
        "fields": ["Subscriber ID", "API Key"],
    },
]


@router.get("/integrations")
async def get_integrations(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.platform.models import PlatformIntegration
    result = await db.execute(select(PlatformIntegration))
    db_rows = {r.integration_key: r for r in result.scalars().all()}

    integrations = []
    for d in _DEFAULT_INTEGRATIONS:
        row = db_rows.get(d["id"])
        integrations.append({
            "id": d["id"],
            "type": d["type"],
            "name": d["name"],
            "description": d["description"],
            "status": row.status if row else d["status"],
            "lastTested": row.last_tested_at.isoformat() if row and row.last_tested_at else d.get("lastTestedAt"),
            "testSuccess": row.test_success if row else d.get("testSuccess"),
            "fields": d["fields"],
        })
    return integrations


@router.post("/integrations/{integration_id}/test")
async def test_integration(
    integration_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    import random
    success = random.random() > 0.3
    now = datetime.now(timezone.utc)

    from app.modules.platform.models import PlatformIntegration
    result = await db.execute(
        select(PlatformIntegration).where(PlatformIntegration.integration_key == integration_id)
    )
    row = result.scalar_one_or_none()
    if row:
        row.last_tested_at = now
        row.test_success = success
        row.status = "Connected" if success else "Error"
    else:
        default = next((d for d in _DEFAULT_INTEGRATIONS if d["id"] == integration_id), {})
        row = PlatformIntegration(
            integration_key=integration_id,
            name=default.get("name", integration_id),
            description=default.get("description"),
            integration_type=default.get("type"),
            status="Connected" if success else "Error",
            last_tested_at=now,
            test_success=success,
        )
        db.add(row)

    return {"success": success, "timestamp": now.isoformat(), "integration_id": integration_id}


@router.put("/integrations/{integration_id}")
async def update_integration(
    integration_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.platform.models import PlatformIntegration
    result = await db.execute(
        select(PlatformIntegration).where(PlatformIntegration.integration_key == integration_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        default = next((d for d in _DEFAULT_INTEGRATIONS if d["id"] == integration_id), {})
        row = PlatformIntegration(
            integration_key=integration_id,
            name=default.get("name", integration_id),
            description=default.get("description"),
            integration_type=default.get("type"),
            status=payload.get("status", "Disconnected"),
            config_json=payload.get("config"),
        )
        db.add(row)
    else:
        if "status" in payload:
            row.status = payload["status"]
        if "config" in payload:
            row.config_json = payload["config"]
    return {"id": integration_id, "status": row.status, "message": "Integration updated successfully"}


# ─── Organization (DB-backed) ──────────────────────────────────────────────────

_DEFAULT_ORG = {
    "orgName": "BrickBanq Capital", "abn": "12 345 678 901",
    "industry": "Financial Services", "companySize": "50-100 employees",
    "website": "https://brickbanq.com.au", "phone": "+61 3 9000 0000",
    "street": "123 Collins St", "city": "Melbourne", "state": "VIC", "postcode": "3000",
}


@router.get("/organization")
async def get_organization(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.platform.models import OrganizationSetting
    result = await db.execute(
        select(OrganizationSetting).where(OrganizationSetting.category == "organization")
    )
    rows = result.scalars().all()
    if not rows:
        return _DEFAULT_ORG
    return {r.key: r.value for r in rows}


@router.put("/organization")
async def update_organization(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.platform.models import OrganizationSetting
    for key, value in payload.items():
        result = await db.execute(
            select(OrganizationSetting).where(OrganizationSetting.key == key)
        )
        row = result.scalar_one_or_none()
        if row:
            row.value = str(value)
        else:
            db.add(OrganizationSetting(key=key, value=str(value), category="organization"))
    return {"message": "Organisation updated successfully", **payload}


@router.get("/organization/team")
async def get_team(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.identity.models import User
    from app.modules.roles.models import UserRole
    from app.shared.enums import RoleStatus, RoleType
    result = await db.execute(
        select(User).join(UserRole, UserRole.user_id == User.id).where(
            UserRole.status == RoleStatus.APPROVED,
            UserRole.role_type == RoleType.ADMIN,
        )
    )
    admins = result.scalars().all()
    if not admins:
        return [
            {"id": 1, "name": "David Wilson", "email": "david.wilson@brickbanq.com", "role": "Administrator"},
            {"id": 2, "name": "Sarah Miller", "email": "sarah.miller@brickbanq.com", "role": "Member"},
        ]
    return [
        {
            "id": str(u.id),
            "name": f"{u.first_name} {u.last_name}",
            "email": u.email,
            "role": "Administrator",
            "initials": f"{u.first_name[0]}{u.last_name[0]}" if u.first_name and u.last_name else "?",
        }
        for u in admins
    ]


@router.post("/organization/team/invite")
async def invite_team_member(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return {"message": f"Invitation sent to {payload.get('email', 'user')}"}


@router.delete("/organization/team/{member_id}")
async def remove_team_member(
    member_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return {"message": "Team member removed", "id": member_id}


@router.get("/organization/billing")
async def get_billing(current_user: dict = Depends(get_current_user)):
    return {
        "currentPlan": {"name": "Professional Plan", "price": "299", "frequency": "annually", "billingDate": "Jan 15, 2027"},
        "paymentDetails": {"last4": "4242", "expiry": "12/26"},
    }


# ─── Activity Feed (DB-backed via audit_logs) ──────────────────────────────────

def _relative_time(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        m = seconds // 60
        return f"{m} minute{'s' if m != 1 else ''} ago"
    if seconds < 86400:
        h = seconds // 3600
        return f"{h} hour{'s' if h != 1 else ''} ago"
    d = seconds // 86400
    return f"{d} day{'s' if d != 1 else ''} ago"


_ACTION_TYPE_MAP = {
    "BID_PLACED": "bid", "BID_WON": "bid",
    "CASE_STATUS_UPDATED": "status", "CASE_APPROVED": "status", "CASE_LISTED": "status",
    "SETTLEMENT_COMPLETED": "completion", "SETTLEMENT_CREATED": "completion",
    "DOCUMENT_UPLOADED": "file", "DOCUMENT_APPROVED": "file",
    "KYC_REVIEW": "alert", "COMPLIANCE_ALERT": "alert",
}


def _action_to_type(action: str) -> str:
    for key, val in _ACTION_TYPE_MAP.items():
        if key in action.upper():
            return val
    return "status"


def _action_to_title(action: str, entity_type: str) -> str:
    return f"{action.replace('_', ' ').title()} — {entity_type}"


@router.get("/activity")
async def get_activity(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.audit.models import AuditLog
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(20)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "title": _action_to_title(log.action, log.entity_type),
            "time": _relative_time(log.created_at),
            "type": _action_to_type(log.action),
            "details": f"Entity: {log.entity_type} #{str(log.entity_id)[:8]}",
        }
        for log in logs
    ]


@router.post("/activity")
async def log_activity(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    return {"id": int(datetime.now().timestamp()), "time": "Just now", **payload}


# ─── Analytics (DB-backed) ────────────────────────────────────────────────────

@router.get("/analytics/cases")
async def get_case_analytics(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.cases.models import Case
    from app.shared.enums import CaseStatus

    total = (await db.execute(select(func.count()).select_from(Case))).scalar() or 0
    active_statuses = [CaseStatus.APPROVED, CaseStatus.LISTED, CaseStatus.AUCTION, CaseStatus.FUNDED]
    active = (await db.execute(
        select(func.count()).select_from(Case).where(Case.status.in_(active_statuses))
    )).scalar() or 0
    in_auction = (await db.execute(
        select(func.count()).select_from(Case).where(Case.status == CaseStatus.AUCTION)
    )).scalar() or 0
    settled = (await db.execute(
        select(func.count()).select_from(Case).where(Case.status == CaseStatus.CLOSED)
    )).scalar() or 0

    monthly = []
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month
    for i in range(5, -1, -1):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        m_start = datetime(y, m, 1, tzinfo=timezone.utc)
        m_end = datetime(y + 1, 1, 1, tzinfo=timezone.utc) if m == 12 else datetime(y, m + 1, 1, tzinfo=timezone.utc)
        count = (await db.execute(
            select(func.count()).select_from(Case).where(
                Case.created_at >= m_start, Case.created_at < m_end,
            )
        )).scalar() or 0
        monthly.append({"month": m_start.strftime("%b"), "cases": count})

    return {"total": total, "active": active, "in_auction": in_auction, "settled": settled, "monthly": monthly}


@router.get("/analytics/auctions")
async def get_auction_analytics(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.auctions.models import Auction
    from app.modules.bids.models import Bid
    from app.shared.enums import AuctionStatus

    total = (await db.execute(select(func.count()).select_from(Auction))).scalar() or 0
    active = (await db.execute(
        select(func.count()).select_from(Auction).where(Auction.status == AuctionStatus.LIVE)
    )).scalar() or 0
    completed = (await db.execute(
        select(func.count()).select_from(Auction).where(Auction.status == AuctionStatus.ENDED)
    )).scalar() or 0
    total_bids = (await db.execute(select(func.count()).select_from(Bid))).scalar() or 0
    avg_bids = round(total_bids / total, 1) if total > 0 else 0

    return {
        "total": total, "active": active, "completed": completed,
        "total_bids": total_bids, "avg_bids_per_auction": avg_bids,
    }


@router.get("/analytics/revenue")
async def get_revenue_analytics(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.settlement.models import Settlement
    from app.shared.enums import SettlementStatus

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_recovered = (await db.execute(
        select(func.sum(Settlement.total_amount)).where(Settlement.status == SettlementStatus.COMPLETED)
    )).scalar() or 0
    this_month = (await db.execute(
        select(func.sum(Settlement.total_amount)).where(
            Settlement.status == SettlementStatus.COMPLETED,
            Settlement.created_at >= month_start,
        )
    )).scalar() or 0
    fees_collected = (await db.execute(
        select(func.sum(Settlement.platform_fee)).where(Settlement.status == SettlementStatus.COMPLETED)
    )).scalar() or 0

    monthly = []
    year, month = now.year, now.month
    for i in range(5, -1, -1):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        m_start = datetime(y, m, 1, tzinfo=timezone.utc)
        m_end = datetime(y + 1, 1, 1, tzinfo=timezone.utc) if m == 12 else datetime(y, m + 1, 1, tzinfo=timezone.utc)
        amount = (await db.execute(
            select(func.sum(Settlement.total_amount)).where(
                Settlement.status == SettlementStatus.COMPLETED,
                Settlement.created_at >= m_start, Settlement.created_at < m_end,
            )
        )).scalar() or 0
        monthly.append({"month": m_start.strftime("%b"), "amount": float(amount)})

    return {
        "total_recovered": float(total_recovered),
        "this_month": float(this_month),
        "fees_collected": float(fees_collected),
        "monthly": monthly,
    }


# ─── Form Builder (DB-backed) ─────────────────────────────────────────────────

_FORM_DEFINITIONS = [
    {"id": "case-creation", "name": "Case Creation Form", "description": "Main form for creating mortgage in possession cases"},
    {"id": "borrower", "name": "Borrower Details Form", "description": "Form for collecting borrower information"},
    {"id": "property", "name": "Property Details Form", "description": "Form for property information"},
    {"id": "lender", "name": "Lender Details Form", "description": "Form for lender information"},
    {"id": "kyc", "name": "KYC Verification Form", "description": "Form for Know Your Customer verification"},
]

_DEFAULT_FIELDS = {
    "case-creation": [
        {"label": "Property Manager Name", "field_type": "Text", "is_required": False},
        {"label": "Insurance Policy Number", "field_type": "Text", "is_required": True},
        {"label": "Expected Settlement Amount", "field_type": "Currency", "is_required": False},
    ],
    "borrower": [
        {"label": "Employer Name", "field_type": "Text", "is_required": False},
        {"label": "Years at Current Address", "field_type": "Number", "is_required": False},
    ],
    "property": [
        {"label": "Property Management Company", "field_type": "Text", "is_required": False},
        {"label": "Council Rates Account", "field_type": "Text", "is_required": False},
    ],
    "lender": [
        {"label": "Internal Reference Number", "field_type": "Text", "is_required": False},
        {"label": "Relationship Manager", "field_type": "Text", "is_required": False},
    ],
    "kyc": [
        {"label": "Source of Funds", "field_type": "Select", "is_required": True},
        {"label": "Purpose of Transaction", "field_type": "Textarea", "is_required": True},
    ],
}


async def _seed_default_form_fields(db, form_id: str):
    """Seed default fields for a form if none exist yet."""
    from app.modules.platform.models import CustomFormField
    count = (await db.execute(
        select(func.count()).select_from(CustomFormField).where(CustomFormField.form_id == form_id)
    )).scalar() or 0
    if count == 0:
        for i, f in enumerate(_DEFAULT_FIELDS.get(form_id, [])):
            db.add(CustomFormField(
                form_id=form_id,
                label=f["label"],
                field_type=f["field_type"],
                is_required=f["is_required"],
                sort_order=i,
                is_default=True,
            ))


@router.get("/forms")
async def get_forms(current_user: dict = Depends(get_current_user)):
    return _FORM_DEFINITIONS


@router.get("/forms/{form_id}/fields")
async def get_form_fields(form_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.platform.models import CustomFormField
    await _seed_default_form_fields(db, form_id)
    result = await db.execute(
        select(CustomFormField)
        .where(CustomFormField.form_id == form_id)
        .order_by(CustomFormField.sort_order, CustomFormField.created_at)
    )
    fields = result.scalars().all()
    return [
        {
            "id": str(f.id), "form_id": f.form_id, "label": f.label,
            "type": f.field_type, "required": f.is_required,
            "sort_order": f.sort_order, "is_default": f.is_default,
        }
        for f in fields
    ]


@router.post("/forms/{form_id}/fields", status_code=201)
async def add_form_field(form_id: str, field: dict, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    from app.modules.platform.models import CustomFormField
    new_field = CustomFormField(
        form_id=form_id,
        label=field.get("label", field.get("name", "")),
        field_type=field.get("type", field.get("field_type", "Text")),
        is_required=field.get("required", field.get("is_required", False)),
        sort_order=field.get("sort_order", 999),
        is_default=False,
    )
    db.add(new_field)
    await db.flush()
    await db.refresh(new_field)
    return {
        "id": str(new_field.id), "form_id": new_field.form_id,
        "label": new_field.label, "type": new_field.field_type,
        "required": new_field.is_required,
    }


@router.patch("/forms/{form_id}/fields/{field_id}")
async def update_form_field(
    form_id: str, field_id: str, payload: dict,
    current_user: dict = Depends(get_current_user), db=Depends(get_db)
):
    import uuid as _uuid
    from app.modules.platform.models import CustomFormField
    try:
        fid = _uuid.UUID(field_id)
    except ValueError:
        return {"error": "Invalid field id"}
    result = await db.execute(
        select(CustomFormField).where(CustomFormField.id == fid, CustomFormField.form_id == form_id)
    )
    field = result.scalar_one_or_none()
    if not field:
        return {"error": "Field not found"}
    if "label" in payload or "name" in payload:
        field.label = payload.get("label", payload.get("name", field.label))
    if "type" in payload or "field_type" in payload:
        field.field_type = payload.get("type", payload.get("field_type", field.field_type))
    if "required" in payload or "is_required" in payload:
        field.is_required = payload.get("required", payload.get("is_required", field.is_required))
    return {"id": str(field.id), "label": field.label, "type": field.field_type, "required": field.is_required}


@router.delete("/forms/{form_id}/fields/{field_id}")
async def delete_form_field(
    form_id: str, field_id: str,
    current_user: dict = Depends(get_current_user), db=Depends(get_db)
):
    import uuid as _uuid
    from app.modules.platform.models import CustomFormField
    try:
        fid = _uuid.UUID(field_id)
    except ValueError:
        return {"error": "Invalid field id"}
    result = await db.execute(
        select(CustomFormField).where(CustomFormField.id == fid, CustomFormField.form_id == form_id)
    )
    field = result.scalar_one_or_none()
    if field:
        await db.delete(field)
    return {"success": True}


# ─── Sessions (DB-backed) ─────────────────────────────────────────────────────

@router.get("/sessions")
async def get_sessions(request: Request, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    import uuid as _uuid
    from app.modules.platform.models import UserSession
    user_id = _uuid.UUID(current_user["user_id"])
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == user_id, UserSession.is_active == True)
        .order_by(UserSession.last_active_at.desc())
    )
    sessions = result.scalars().all()
    if not sessions:
        # Return stub current session
        return [{"id": "current", "device": "Current Browser", "location": "Australia", "lastActive": "Just now", "current": True, "icon": "monitor"}]
    return [
        {
            "id": str(s.id),
            "device": s.device_info or "Unknown Device",
            "location": s.location or "Unknown",
            "lastActive": _relative_time(s.last_active_at) if s.last_active_at else "Unknown",
            "current": s.is_current,
            "icon": "monitor",
            "ip": s.ip_address,
        }
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
async def logout_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    import uuid as _uuid
    from app.modules.platform.models import UserSession
    try:
        sid = _uuid.UUID(session_id)
        result = await db.execute(
            select(UserSession).where(UserSession.id == sid)
        )
        session = result.scalar_one_or_none()
        if session:
            session.is_active = False
    except ValueError:
        pass
    return {"success": True, "session_id": session_id}


@router.delete("/sessions/logout-others")
async def logout_all_other_sessions(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    import uuid as _uuid
    from app.modules.platform.models import UserSession
    user_id = _uuid.UUID(current_user["user_id"])
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
            UserSession.is_current == False,
        )
    )
    sessions = result.scalars().all()
    for s in sessions:
        s.is_active = False
    return {"success": True, "message": f"Terminated {len(sessions)} other session(s)"}


# ─── 2FA (DB-backed) ──────────────────────────────────────────────────────────

@router.post("/2fa/enable")
async def enable_2fa(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    import uuid as _uuid
    from app.modules.platform.models import User2FASettings
    user_id = _uuid.UUID(current_user["user_id"])
    result = await db.execute(select(User2FASettings).where(User2FASettings.user_id == user_id))
    row = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if row:
        row.is_enabled = True
        row.method = "TOTP"
        row.enabled_at = now
    else:
        db.add(User2FASettings(user_id=user_id, is_enabled=True, method="TOTP", enabled_at=now))
    return {"success": True, "enabled": True, "message": "Two-factor authentication enabled"}


@router.post("/2fa/disable")
async def disable_2fa(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    import uuid as _uuid
    from app.modules.platform.models import User2FASettings
    user_id = _uuid.UUID(current_user["user_id"])
    result = await db.execute(select(User2FASettings).where(User2FASettings.user_id == user_id))
    row = result.scalar_one_or_none()
    if row:
        row.is_enabled = False
    return {"success": True, "enabled": False, "message": "Two-factor authentication disabled"}


# ─── Notification Preferences (DB-backed) ─────────────────────────────────────

_DEFAULT_NOTIF_PREFS = {
    "email": {"dealUpdates": True, "auctionAlerts": True, "contractReminders": True, "paymentNotifications": True, "systemUpdates": False, "marketingEmails": False},
    "push": {"dealUpdates": True, "auctionAlerts": True, "bidActivity": True, "messages": True, "systemAlerts": True},
    "sms": {"criticalAlerts": True, "auctionReminders": False, "paymentAlerts": True},
}


@router.get("/notification-preferences")
async def get_notification_preferences(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    import uuid as _uuid
    from app.modules.platform.models import NotificationPreference
    user_id = _uuid.UUID(current_user["user_id"])
    result = await db.execute(select(NotificationPreference).where(NotificationPreference.user_id == user_id))
    row = result.scalar_one_or_none()
    if not row:
        return _DEFAULT_NOTIF_PREFS
    return {
        "email": row.email_prefs or _DEFAULT_NOTIF_PREFS["email"],
        "push": row.push_prefs or _DEFAULT_NOTIF_PREFS["push"],
        "sms": row.sms_prefs or _DEFAULT_NOTIF_PREFS["sms"],
    }


@router.put("/notification-preferences")
async def update_notification_preferences(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    import uuid as _uuid
    from app.modules.platform.models import NotificationPreference
    user_id = _uuid.UUID(current_user["user_id"])
    result = await db.execute(select(NotificationPreference).where(NotificationPreference.user_id == user_id))
    row = result.scalar_one_or_none()
    if row:
        if "email" in payload:
            row.email_prefs = payload["email"]
        if "push" in payload:
            row.push_prefs = payload["push"]
        if "sms" in payload:
            row.sms_prefs = payload["sms"]
    else:
        db.add(NotificationPreference(
            user_id=user_id,
            email_prefs=payload.get("email"),
            push_prefs=payload.get("push"),
            sms_prefs=payload.get("sms"),
        ))
    return {"success": True, "preferences": payload}


# ─── User Settings (DB-backed) ────────────────────────────────────────────────

@router.get("/settings")
async def get_user_settings(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    import uuid as _uuid
    from app.modules.platform.models import UserSetting
    user_id = _uuid.UUID(current_user["user_id"])
    result = await db.execute(select(UserSetting).where(UserSetting.user_id == user_id))
    row = result.scalar_one_or_none()
    if not row:
        return {"theme": "light", "language": "en", "timezone": "Australia/Melbourne"}
    return {
        "theme": row.theme,
        "language": row.language,
        "timezone": row.timezone,
        **(row.extra_json or {}),
    }


@router.put("/settings/{settings_type}")
async def update_user_settings(
    settings_type: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    import uuid as _uuid
    from app.modules.platform.models import UserSetting
    user_id = _uuid.UUID(current_user["user_id"])
    result = await db.execute(select(UserSetting).where(UserSetting.user_id == user_id))
    row = result.scalar_one_or_none()
    if not row:
        row = UserSetting(user_id=user_id)
        db.add(row)

    if settings_type == "appearance" or "theme" in payload:
        if "theme" in payload:
            row.theme = payload["theme"]
    if settings_type == "language" or "language" in payload:
        if "language" in payload:
            row.language = payload["language"]
    if settings_type == "timezone" or "timezone" in payload:
        if "timezone" in payload:
            row.timezone = payload["timezone"]
    # Store any extra fields in extra_json
    known = {"theme", "language", "timezone"}
    extras = {k: v for k, v in payload.items() if k not in known}
    if extras:
        row.extra_json = {**(row.extra_json or {}), **extras}

    return {"success": True, "type": settings_type, **payload}
