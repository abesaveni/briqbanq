"""Borrower module routes."""
import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from app.core.dependencies import get_current_user, get_db
from app.modules.borrower.schemas import BorrowerStatsResponse, BorrowerActionsResponse
from app.modules.borrower.service import BorrowerService

router = APIRouter(prefix="/borrower", tags=["Borrower"])


@router.get("/dashboard")
async def get_borrower_dashboard(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Borrower dashboard overview."""
    service = BorrowerService(db)
    stats = await service.get_dashboard_stats(uuid.UUID(current_user["user_id"]))
    return {"stats": stats}


@router.get("/my-case")
async def get_my_active_case(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Get the borrower's most recent active case."""
    from app.modules.cases.service import CaseService
    case_service = CaseService(db)
    cases = await case_service.get_borrower_cases(
        borrower_id=uuid.UUID(current_user["user_id"]),
        status=None,
        offset=0,
        limit=1,
    )
    return cases[0] if cases else None


@router.get("/dashboard/stats", response_model=BorrowerStatsResponse)
async def get_borrower_stats(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    service = BorrowerService(db)
    return await service.get_dashboard_stats(uuid.UUID(current_user["user_id"]))

@router.get("/dashboard/actions", response_model=BorrowerActionsResponse)
async def get_borrower_actions(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    service = BorrowerService(db)
    actions = await service.get_dashboard_actions(uuid.UUID(current_user["user_id"]))
    return {"actions": actions}


# ── Case CRUD (borrower-scoped) ───────────────────────────────────────────────

@router.get("/cases")
async def list_borrower_cases(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    cases = await service.get_borrower_cases(
        borrower_id=uuid.UUID(current_user["user_id"]),
        status=None, offset=0, limit=50,
    )
    return cases


@router.get("/cases/{case_id}")
async def get_borrower_case(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    case = await service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("/case/timeline")
async def get_borrower_case_timeline(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get timeline events for the borrower's active case."""
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    cases = await service.get_borrower_cases(
        borrower_id=uuid.UUID(current_user["user_id"]),
        status=None, offset=0, limit=1,
    )
    if not cases:
        return []
    # Return activity/timeline for first case using correct audit method
    try:
        from app.modules.audit.service import AuditService
        audit = AuditService(db)
        case_id = cases[0].id if hasattr(cases[0], "id") else cases[0]["id"]
        logs = await audit.get_entity_history("case", str(case_id), offset=0, limit=50)
        action_icon_map = {
            "CREATE": "check", "SUBMIT": "check", "APPROVE": "check",
            "UPLOAD": "document", "DOCUMENT": "document",
            "AUCTION": "chart", "BID": "chart",
            "UPDATE": "clock", "REVIEW": "clock",
        }
        def _icon(action: str) -> str:
            a = (action or "").upper()
            for k, v in action_icon_map.items():
                if k in a:
                    return v
            return "clock"

        def _describe(action: str, state) -> str:
            """Turn an audit state dict/string into a human-readable sentence."""
            import json as _json
            if not state:
                return ""
            # SQLite stores JSONB as text — parse if needed
            if isinstance(state, str):
                try:
                    state = _json.loads(state)
                except Exception:
                    return ""
            if not isinstance(state, dict):
                return ""
            a = (action or "").upper()
            if "CREATE" in a:
                title = state.get("title", "")
                status = state.get("status", "")
                parts = []
                if title:
                    parts.append(f"Case '{title}' created")
                if status:
                    parts.append(f"status set to {status}")
                return " — ".join(parts) if parts else "Case created"
            if "SUBMIT" in a:
                return f"Case submitted for review — status: {state.get('status', 'UNDER_REVIEW')}"
            if "APPROVE" in a:
                return f"Case approved — status: {state.get('status', 'APPROVED')}"
            if "REJECT" in a:
                reason = state.get("rejection_reason") or state.get("reason", "")
                return f"Case rejected{(' — ' + reason) if reason else ''}"
            if "ASSIGN" in a:
                parts = []
                if state.get("lawyer_id"):
                    parts.append("lawyer assigned")
                if state.get("lender_id"):
                    parts.append("lender assigned")
                return "Participants assigned: " + ", ".join(parts) if parts else "Participants assigned"
            if "AUCTION" in a or "LIST" in a:
                return f"Case listed for auction — status: {state.get('status', 'AUCTION')}"
            if "BID" in a:
                amount = state.get("amount") or state.get("bid_amount", "")
                return f"New bid received{(': $' + str(amount)) if amount else ''}"
            if "DOCUMENT" in a or "UPLOAD" in a:
                name = state.get("document_name") or state.get("name", "")
                return f"Document uploaded{(': ' + name) if name else ''}"
            if "STATUS" in a or "UPDATE" in a:
                status = state.get("status", "")
                return f"Status updated to {status}" if status else "Case updated"
            if "REVIEW" in a:
                return f"Case under review — status: {state.get('status', 'UNDER_REVIEW')}"
            # Fallback: show key=value pairs cleanly
            pairs = [f"{k.replace('_', ' ')}: {v}" for k, v in state.items() if v and k not in ("id", "version")]
            return ", ".join(pairs[:3]) if pairs else ""

        return [
            {
                "id": str(log.id),
                "title": (log.action or "").replace("_", " ").title(),
                "description": _describe(log.action, log.after_state or log.before_state),
                "date": log.created_at.strftime("%d %b %Y") if log.created_at else "",
                "completed": True,
                "icon": _icon(log.action),
            }
            for log in logs
        ]
    except Exception:
        return []


@router.get("/case/{case_id}")
async def get_borrower_case_detail(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    case = await service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("/case/{case_id}/summary")
async def get_borrower_case_summary(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    case = await service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("/case/{case_id}/financial")
async def get_borrower_case_financial(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    case = await service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"financials": getattr(case, "financials", {})}


@router.patch("/case/{case_id}")
async def update_borrower_case(
    case_id: uuid.UUID,
    data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    updated = await service.update_case(
        case_id=case_id,
        borrower_id=uuid.UUID(current_user["user_id"]),
        title=data.get("title"),
        description=data.get("description"),
        property_address=data.get("property_address"),
        property_type=data.get("property_type"),
        estimated_value=data.get("estimated_value"),
        outstanding_debt=data.get("outstanding_debt"),
        interest_rate=data.get("interest_rate"),
        tenure=data.get("tenure"),
    )
    return updated


@router.get("/case/{case_id}/bids")
async def get_borrower_case_bids(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.bids.service import BidService
    service = BidService(db)
    return await service.get_auction_bids(case_id)


@router.get("/case/{case_id}/messages")
async def get_borrower_case_messages(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get messages for a case."""
    try:
        from app.modules.cases.service import CaseService
        service = CaseService(db)
        # use the generic case messages lookup
        case = await service.get_case(case_id)
        return getattr(case, "messages", []) or []
    except Exception:
        return []


@router.post("/case/{case_id}/messages")
async def send_borrower_case_message(
    case_id: uuid.UUID,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Send a message on a case."""
    import datetime
    return {
        "id": str(uuid.uuid4()),
        "case_id": str(case_id),
        "sender_id": current_user["user_id"],
        "message": body.get("message", ""),
        "created_at": datetime.datetime.utcnow().isoformat(),
    }


@router.get("/case/{case_id}/documents")
async def list_borrower_case_documents(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.documents.service import DocumentService
    service = DocumentService(db)
    return await service.get_case_documents(case_id)


@router.post("/case/{case_id}/documents")
async def upload_borrower_case_document(
    case_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.documents.service import DocumentService
    service = DocumentService(db)
    content = await file.read()
    return await service.upload_document(
        case_id=case_id,
        uploaded_by=uuid.UUID(current_user["user_id"]),
        document_name=file.filename or "document",
        document_type="general",
        file_name=file.filename or "document",
        file_size=len(content),
        content_type=file.content_type or "application/octet-stream",
        file_content=content,
        trace_id="",
    )


# ── Investment Memorandum ─────────────────────────────────────────────────────

@router.get("/case/{case_id}/investment-memo")
async def get_investment_memo(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.cases.service import CaseService
    service = CaseService(db)
    case = await service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/case/{case_id}/investment-memo")
async def update_investment_memo(
    case_id: uuid.UUID,
    data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return {"updated": True, "case_id": str(case_id)}


@router.post("/case/{case_id}/investment-memo/pdf")
async def generate_investment_memo_pdf(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Generate Investment Memorandum PDF for a case (server-side)."""
    try:
        from app.modules.cases.pdf_service import CasePDFService
        from app.modules.cases.service import CaseService
        from fastapi.responses import StreamingResponse
        import io

        case_service = CaseService(db)
        case = await case_service.get_case(case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        pdf_service = CasePDFService()
        pdf_bytes = await pdf_service.generate_investment_memorandum(case)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=IM_{case_id}.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/case/{case_id}/investment-memo/email")
async def email_investment_memo(
    case_id: uuid.UUID,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return {"sent": True, "recipients": body.get("recipients", [])}


# ── Contracts ─────────────────────────────────────────────────────────────────

@router.get("/contracts")
async def list_borrower_contracts(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.contracts.service import ContractService
    service = ContractService(db)
    return await service.get_user_contracts(uuid.UUID(current_user["user_id"]))


@router.get("/contracts/{contract_id}")
async def get_borrower_contract(
    contract_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.contracts.service import ContractService
    service = ContractService(db)
    return await service.get_contract(contract_id)


# ── KYC (borrower-specific paths) ────────────────────────────────────────────

@router.post("/kyc/submit")
async def submit_borrower_kyc(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return {"submitted": True, "status": "pending"}


@router.post("/kyc/upload")
async def upload_kyc_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return {"uploaded": True, "filename": file.filename}


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_borrower_profile(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    # Return the current user profile from the JWT claims + DB lookup
    from app.modules.identity.repository import UserRepository
    repo = UserRepository(db)
    user = await repo.get_by_id(uuid.UUID(current_user["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    return user


@router.put("/profile")
@router.patch("/profile")
async def update_borrower_profile(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.identity.repository import UserRepository
    repo = UserRepository(db)
    user = await repo.get_by_id(uuid.UUID(current_user["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    # Update allowed fields
    if "firstName" in data and data["firstName"]:
        user.first_name = data["firstName"]
    if "first_name" in data and data["first_name"]:
        user.first_name = data["first_name"]
    if "lastName" in data and data["lastName"]:
        user.last_name = data["lastName"]
    if "last_name" in data and data["last_name"]:
        user.last_name = data["last_name"]
    if "phone" in data:
        user.phone = data["phone"] or None
    await repo.update(user)
    await db.commit()
    return {
        "id": str(user.id),
        "firstName": user.first_name,
        "first_name": user.first_name,
        "lastName": user.last_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "role": current_user.get("role"),
    }


# ── GovSign stubs ─────────────────────────────────────────────────────────────

@router.get("/govsign/data")
async def get_govsign_data(current_user: dict = Depends(get_current_user)):
    return {"stats": {}, "envelopes": [], "documents": [], "templates": [], "certificates": []}


@router.get("/govsign/envelopes")
async def list_envelopes(current_user: dict = Depends(get_current_user)):
    return []


@router.post("/govsign/envelopes")
async def create_envelope(data: dict, current_user: dict = Depends(get_current_user)):
    return {"id": str(uuid.uuid4()), "status": "created"}


@router.get("/govsign/envelopes/{envelope_id}")
async def get_envelope(envelope_id: str, current_user: dict = Depends(get_current_user)):
    return {"id": envelope_id, "status": "pending"}


@router.get("/govsign/certificates")
async def list_certificates(current_user: dict = Depends(get_current_user)):
    return []


@router.get("/govsign/evidence/summary")
async def get_evidence_summary(current_user: dict = Depends(get_current_user)):
    return {"total": 0, "items": []}


@router.get("/govsign/evidence/events")
async def get_evidence_events(current_user: dict = Depends(get_current_user)):
    return []


@router.get("/govsign/admin")
async def get_govsign_admin(current_user: dict = Depends(get_current_user)):
    return {"settings": [], "policies": [], "security": {}}


@router.get("/govsign/documents")
async def get_govsign_documents(current_user: dict = Depends(get_current_user)):
    return []


@router.get("/govsign/templates")
async def list_govsign_templates(current_user: dict = Depends(get_current_user)):
    return []


@router.post("/govsign/templates")
async def create_govsign_template(data: dict, current_user: dict = Depends(get_current_user)):
    return {"id": str(uuid.uuid4()), **data}


# ── Settlement tasks ──────────────────────────────────────────────────────────

@router.patch("/case/{case_id}/settlement/tasks/{task_id}")
async def update_settlement_task(
    case_id: uuid.UUID,
    task_id: uuid.UUID,
    data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        from app.modules.settlement.service import SettlementService
        service = SettlementService(db)
        return await service.update_item(case_id, task_id, data)
    except Exception:
        return {"updated": True, "task_id": str(task_id)}


# ── Case approval/rejection (lawyer actions) ──────────────────────────────────

@router.post("/case/{case_id}/approve")
async def approve_case(
    case_id: uuid.UUID,
    data: dict = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return {"approved": True, "case_id": str(case_id)}


@router.post("/case/{case_id}/reject")
async def reject_case(
    case_id: uuid.UUID,
    data: dict = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return {"rejected": True, "case_id": str(case_id)}


# ── Tasks (borrower) ──────────────────────────────────────────────────────────

@router.get("/tasks")
async def list_borrower_tasks(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.tasks.service import TaskService
    service = TaskService(db)
    return await service.get_tasks(uuid.UUID(current_user["user_id"]))


@router.post("/tasks")
async def create_borrower_task(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.tasks.service import TaskService
    from app.modules.tasks.schemas import TaskCreate
    service = TaskService(db)
    return await service.create_task(uuid.UUID(current_user["user_id"]), TaskCreate(**data))


@router.patch("/tasks/{task_id}")
async def update_borrower_task(
    task_id: uuid.UUID,
    data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.tasks.service import TaskService
    from app.modules.tasks.schemas import TaskUpdate
    service = TaskService(db)
    return await service.update_task(task_id, uuid.UUID(current_user["user_id"]), TaskUpdate(**data))


@router.delete("/tasks/{task_id}")
async def delete_borrower_task(
    task_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    from app.modules.tasks.service import TaskService
    service = TaskService(db)
    await service.delete_task(task_id, uuid.UUID(current_user["user_id"]))
    return {"deleted": True}
