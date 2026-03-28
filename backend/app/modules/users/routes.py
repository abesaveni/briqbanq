"""Users module routes alias for identity."""
import uuid
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, get_db, get_trace_id
from app.modules.identity.schemas import UserResponse, UserUpdateRequest
from app.modules.identity.service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    service = UserService(db)
    return await service.get_user(uuid.UUID(current_user["user_id"]))

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    request: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    trace_id: str = Depends(get_trace_id),
):
    service = UserService(db)
    return await service.update_profile(uuid.UUID(current_user["user_id"]), request, trace_id)
