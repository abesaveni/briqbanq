"""
Platform module — supplemental routes.
Handles case images (DB-tracked) and any other platform-level endpoints.
"""

import uuid
import pathlib
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy import select

from app.core.dependencies import get_current_user, get_db

router = APIRouter(prefix="/platform", tags=["Platform"])


# ─── Case Images (DB-tracked) ──────────────────────────────────────────────────
# Note: Case image upload/get is already handled in cases/routes.py.
# This router adds extra platform-wide endpoints.


@router.get("/case-images/{case_id}")
async def list_case_images(
    case_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """List all DB-tracked images for a case."""
    from app.modules.platform.models import CaseImage
    result = await db.execute(
        select(CaseImage)
        .where(CaseImage.case_id == case_id)
        .order_by(CaseImage.is_primary.desc(), CaseImage.created_at)
    )
    images = result.scalars().all()
    return [
        {
            "id": str(img.id),
            "case_id": str(img.case_id),
            "file_name": img.file_name,
            "url": img.url or img.file_path,
            "is_primary": img.is_primary,
            "content_type": img.content_type,
            "created_at": img.created_at.isoformat(),
        }
        for img in images
    ]


@router.delete("/case-images/{image_id}")
async def delete_case_image(
    image_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Delete a case image record (and optionally the file)."""
    from app.modules.platform.models import CaseImage
    result = await db.execute(select(CaseImage).where(CaseImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    # Try to remove from disk
    try:
        p = pathlib.Path(image.file_path)
        if p.exists():
            p.unlink()
    except Exception:
        pass
    await db.delete(image)
    return {"success": True, "id": str(image_id)}
