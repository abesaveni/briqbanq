"""
KYC module — FastAPI routes.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy import select

from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.kyc.policies import KYCPolicy
from app.modules.kyc.schemas import KYCReviewRequest, KYCResponse, KYCSubmitRequest, KYCFormResponse
from app.modules.kyc.service import KYCService

router = APIRouter(prefix="/kyc", tags=["KYC"])


@router.post("/submit", response_model=KYCResponse, status_code=201)
async def submit_kyc(
    request: KYCSubmitRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Submit KYC verification documents (JSON)."""
    service = KYCService(db)
    kyc_record = await service.submit_kyc(
        user_id=uuid.UUID(current_user["user_id"]),
        document_type=request.document_type,
        document_number=request.document_number,
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="kyc_record",
        entity_id=str(kyc_record.id),
        action="SUBMIT_KYC",
        before_state=None,
        after_state={"status": "SUBMITTED", "document_type": request.document_type},
        trace_id=trace_id,
    )

    return kyc_record


@router.post("/submit-form", response_model=KYCFormResponse, status_code=201)
async def submit_kyc_form(
    first_name: str = Form(...),
    last_name: str = Form(...),
    dob: str = Form(...),
    address: str = Form(...),
    company: Optional[str] = Form(None),
    abn: Optional[str] = Form(None),
    id_document: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Submit full KYC form with personal details and government ID file."""
    file_name = None
    file_size = None

    if id_document and id_document.filename:
        file_content = await id_document.read()
        file_name = id_document.filename
        file_size = len(file_content)

        # Store file locally using absolute path
        import pathlib
        upload_dir = pathlib.Path(__file__).parent.parent.parent.parent / "uploads" / "kyc"
        upload_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{uuid.uuid4().hex}_{pathlib.Path(file_name).name}"
        (upload_dir / safe_name).write_bytes(file_content)
        file_name = safe_name

    metadata = {
        "first_name": first_name,
        "last_name": last_name,
        "dob": dob,
        "address": address,
        "company": company or "",
        "abn": abn or "",
        "original_file_name": id_document.filename if id_document and id_document.filename else None,
        "stored_file_name": file_name,
        "file_size": file_size,
    }

    service = KYCService(db)
    kyc_record = await service.submit_kyc(
        user_id=uuid.UUID(current_user["user_id"]),
        document_type="GOVERNMENT_ID",
        document_number=f"{first_name} {last_name}",
        document_s3_key=file_name,
        trace_id=trace_id,
    )

    # Store personal details in metadata_json
    kyc_record.metadata_json = metadata
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(kyc_record, "metadata_json")
    await db.commit()
    await db.refresh(kyc_record)

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="kyc_record",
        entity_id=str(kyc_record.id),
        action="SUBMIT_KYC_FORM",
        before_state=None,
        after_state={"status": "SUBMITTED", "name": f"{first_name} {last_name}"},
        trace_id=trace_id,
    )

    # Send in-app notification + email
    try:
        from app.modules.notifications.service import NotificationService
        from app.infrastructure.email_service import EmailService
        from app.modules.identity.models import User
        from sqlalchemy import select as sa_select

        notif_service = NotificationService(db)
        await notif_service.notify_kyc_submitted(
            user_id=uuid.UUID(current_user["user_id"]), trace_id=trace_id
        )

        user_row = await db.execute(sa_select(User).where(User.id == uuid.UUID(current_user["user_id"])))
        user = user_row.scalar_one_or_none()
        if user:
            await EmailService.send_kyc_submitted_email(
                to_email=user.email,
                name=f"{first_name} {last_name}".strip() or user.email,
            )
    except Exception:
        pass  # Notifications must not block submission

    return kyc_record


@router.get("/my-kyc", response_model=list[KYCResponse])
async def get_my_kyc(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get current user's KYC records."""
    service = KYCService(db)
    return await service.get_user_kyc(uuid.UUID(current_user["user_id"]))


@router.get("/queue")
async def get_kyc_queue(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all KYC submissions with user info for admin review (all statuses)."""
    KYCPolicy.can_review_kyc(current_user)
    service = KYCService(db)
    records = await service.get_all_kyc_records(offset=0, limit=200)
    from app.modules.identity.models import User
    from sqlalchemy import select as sa_select
    # Pre-fetch all users in one query for efficiency
    user_ids = list({r.user_id for r in records})
    users_map = {}
    if user_ids:
        users_result = await db.execute(sa_select(User).where(User.id.in_(user_ids)))
        for u in users_result.scalars().all():
            users_map[u.id] = u
    result = []
    for r in records:
        user = users_map.get(r.user_id)
        meta = r.metadata_json or {}
        result.append({
            "id": str(r.id),
            "user_id": str(r.user_id),
            "user_name": f"{meta.get('first_name', '')} {meta.get('last_name', '')}".strip() or (f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip() if user else "—"),
            "user_email": user.email if user else "—",
            "user_role": ",".join(user.roles) if user and hasattr(user, 'roles') else "borrower",
            "document_type": meta.get("original_file_name") or r.document_type,
            "status": r.status.value,
            "metadata_json": meta,
            "document_s3_key": r.document_s3_key,
            "rejection_reason": r.rejection_reason,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result


@router.get("/pending", response_model=list[KYCResponse])
async def get_pending_kyc(
    page: int = 1,
    page_size: int = 20,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get pending KYC submissions for review (admin only)."""
    KYCPolicy.can_review_kyc(current_user)
    service = KYCService(db)
    offset = (page - 1) * page_size
    return await service.get_pending_reviews(offset=offset, limit=page_size)


@router.post("/{kyc_id}/approve", response_model=KYCResponse)
async def approve_kyc(
    kyc_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Approve a KYC submission (admin only)."""
    KYCPolicy.can_review_kyc(current_user)
    service = KYCService(db)

    # Start review first
    await service.start_review(kyc_id, uuid.UUID(current_user["user_id"]), trace_id)
    kyc_record = await service.approve_kyc(
        kyc_id, uuid.UUID(current_user["user_id"]), trace_id
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="kyc_record",
        entity_id=str(kyc_id),
        action="APPROVE_KYC",
        before_state={"status": "SUBMITTED"},
        after_state={"status": "APPROVED"},
        trace_id=trace_id,
    )

    # Notify the user whose KYC was approved
    try:
        from app.modules.notifications.service import NotificationService
        from app.infrastructure.email_service import EmailService
        from app.modules.identity.models import User
        from sqlalchemy import select as sa_select

        notif_service = NotificationService(db)
        await notif_service.notify_kyc_approved(user_id=kyc_record.user_id, trace_id=trace_id)

        user_row = await db.execute(sa_select(User).where(User.id == kyc_record.user_id))
        user = user_row.scalar_one_or_none()
        if user:
            meta = kyc_record.metadata_json or {}
            name = f"{meta.get('first_name', '')} {meta.get('last_name', '')}".strip() or user.email
            await EmailService.send_kyc_approved_email(to_email=user.email, name=name)
    except Exception:
        pass

    return kyc_record


@router.post("/{kyc_id}/reject", response_model=KYCResponse)
async def reject_kyc(
    kyc_id: uuid.UUID,
    request: KYCReviewRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Reject a KYC submission (admin only)."""
    KYCPolicy.can_review_kyc(current_user)
    service = KYCService(db)

    await service.start_review(kyc_id, uuid.UUID(current_user["user_id"]), trace_id)
    kyc_record = await service.reject_kyc(
        kyc_id, uuid.UUID(current_user["user_id"]), request.rejection_reason, trace_id
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role="ADMIN",
        entity_type="kyc_record",
        entity_id=str(kyc_id),
        action="REJECT_KYC",
        before_state={"status": "SUBMITTED"},
        after_state={"status": "REJECTED", "reason": request.rejection_reason},
        trace_id=trace_id,
    )

    # Notify the user whose KYC was rejected
    try:
        from app.modules.notifications.service import NotificationService
        from app.infrastructure.email_service import EmailService
        from app.modules.identity.models import User
        from sqlalchemy import select as sa_select

        notif_service = NotificationService(db)
        await notif_service.notify_kyc_rejected(
            user_id=kyc_record.user_id,
            reason=request.rejection_reason or "",
            trace_id=trace_id,
        )

        user_row = await db.execute(sa_select(User).where(User.id == kyc_record.user_id))
        user = user_row.scalar_one_or_none()
        if user:
            meta = kyc_record.metadata_json or {}
            name = f"{meta.get('first_name', '')} {meta.get('last_name', '')}".strip() or user.email
            await EmailService.send_kyc_rejected_email(
                to_email=user.email,
                name=name,
                reason=request.rejection_reason or "",
            )
    except Exception:
        pass

    return kyc_record
