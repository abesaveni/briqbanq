"""
Documents module — FastAPI routes.
"""

import os
import uuid
import pathlib

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse

from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.documents.policies import DocumentPolicy
from app.modules.documents.schemas import (
    DocumentDownloadResponse,
    DocumentResponse,
    DocumentReviewRequest,
)
from app.modules.documents.service import DocumentService
from app.modules.identity.schemas import MessageResponse

router = APIRouter(prefix="/documents", tags=["Documents"])

# ── Local upload directory (created automatically) ────────────────────────────
_UPLOAD_DIR = pathlib.Path(__file__).parent.parent.parent.parent / "uploads" / "documents"
_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
_ALLOWED_CONTENT_TYPES = {"application/pdf"}


@router.post("/simple-upload", tags=["Documents"], status_code=200)
async def simple_upload_document(
    file: UploadFile = File(...),
):
    """
    Upload a PDF document (public helper endpoint).

    Validates:
    - File type must be application/pdf
    - File size must be ≤ 5 MB

    Saves the file to the local `uploads/documents/` directory and returns a
    success response with the saved file name.
    """
    # ── Content-type check ───────────────────────────────────────────────────
    content_type = (file.content_type or "").lower().split(";")[0].strip()
    if content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail="Only PDF files are allowed.",
        )

    # ── Read file (cap at MAX + 1 byte to detect oversize efficiently) ────────
    content = await file.read(_MAX_SIZE_BYTES + 1)
    if len(content) > _MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=422,
            detail="File size must be below 5 MB.",
        )

    # ── Persist to disk with a unique prefix to avoid collisions ─────────────
    original_name = file.filename or "upload.pdf"
    safe_name = pathlib.Path(original_name).name  # strip any path traversal
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    dest = _UPLOAD_DIR / unique_name
    dest.write_bytes(content)

    return JSONResponse(
        status_code=200,
        content={
            "message": "Document uploaded successfully",
            "file_name": unique_name,
        },
    )



@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    case_id: uuid.UUID = Form(...),
    document_name: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Upload a document for a case."""
    DocumentPolicy.can_upload_document(current_user)

    file_content = await file.read()

    service = DocumentService(db)
    document = await service.upload_document(
        case_id=case_id,
        uploaded_by=uuid.UUID(current_user["user_id"]),
        document_name=document_name,
        document_type=document_type,
        file_name=file.filename or "unnamed",
        file_size=len(file_content),
        content_type=file.content_type or "application/octet-stream",
        file_content=file_content,
        trace_id=trace_id,
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="document",
        entity_id=str(document.id),
        action="UPLOAD_DOCUMENT",
        before_state=None,
        after_state={
            "case_id": str(case_id),
            "document_name": document_name,
            "status": "UPLOADED",
        },
        trace_id=trace_id,
    )

    return document


@router.get("", response_model=list[DocumentResponse])
async def get_all_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all documents — admin only."""
    DocumentPolicy.can_review_document(current_user)
    service = DocumentService(db)
    offset = (page - 1) * page_size
    return await service.get_all_documents(offset=offset, limit=page_size)


@router.get("/case/{case_id}", response_model=list[DocumentResponse])
async def get_case_documents(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get all documents for a case."""
    service = DocumentService(db)
    return await service.get_case_documents(case_id)


@router.get("/my-documents", response_model=list[DocumentResponse])
async def get_user_documents(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get documents associated with the current user."""
    service = DocumentService(db)
    # Simple lookup by uploaded_by
    return await service.get_user_documents(uuid.UUID(current_user["user_id"]))


@router.get("/pending-review", response_model=list[DocumentResponse])
async def get_pending_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get documents pending review (admin/lawyer only)."""
    DocumentPolicy.can_review_document(current_user)
    service = DocumentService(db)
    offset = (page - 1) * page_size
    return await service.get_pending_reviews(offset=offset, limit=page_size)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get a specific document."""
    service = DocumentService(db)
    return await service.get_document(document_id)


@router.get("/{document_id}/download", response_model=DocumentDownloadResponse)
async def download_document(
    document_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Get a signed download URL for a document."""
    service = DocumentService(db)
    document = await service.get_document(document_id)
    download_url = await service.get_download_url(document_id)

    return DocumentDownloadResponse(
        document_id=document.id,
        document_name=document.document_name,  # type: ignore[arg-type]
        download_url=download_url,
    )


@router.post("/{document_id}/approve", response_model=DocumentResponse)
async def approve_document(
    document_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Approve a document (admin/lawyer only)."""
    DocumentPolicy.can_review_document(current_user)
    service = DocumentService(db)

    await service.start_review(document_id, uuid.UUID(current_user["user_id"]), trace_id)
    document = await service.approve_document(
        document_id, uuid.UUID(current_user["user_id"]), trace_id
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="document",
        entity_id=str(document_id),
        action="APPROVE_DOCUMENT",
        before_state={"status": "UPLOADED"},
        after_state={"status": "APPROVED"},
        trace_id=trace_id,
    )

    return document


@router.post("/{document_id}/reject", response_model=DocumentResponse)
async def reject_document(
    document_id: uuid.UUID,
    request: DocumentReviewRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Reject a document (admin/lawyer only)."""
    DocumentPolicy.can_review_document(current_user)
    service = DocumentService(db)

    await service.start_review(document_id, uuid.UUID(current_user["user_id"]), trace_id)
    document = await service.reject_document(
        document_id, uuid.UUID(current_user["user_id"]), request.rejection_reason, trace_id
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="document",
        entity_id=str(document_id),
        action="REJECT_DOCUMENT",
        before_state={"status": "UPLOADED"},
        after_state={"status": "REJECTED", "reason": request.rejection_reason},
        trace_id=trace_id,
    )

    return document


@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    """Delete a document (only if UPLOADED or REJECTED)."""
    service = DocumentService(db)
    await service.delete_document(
        document_id, uuid.UUID(current_user["user_id"]), trace_id
    )

    from app.modules.audit.service import AuditService
    audit_service = AuditService(db)
    await audit_service.log(
        actor_id=current_user["user_id"],
        actor_role=",".join(current_user.get("roles", [])),
        entity_type="document",
        entity_id=str(document_id),
        action="DELETE_DOCUMENT",
        before_state=None,
        after_state=None,
        trace_id=trace_id,
    )

    return MessageResponse(message="Document deleted successfully")
