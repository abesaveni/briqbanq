"""Borrower module schemas."""
from pydantic import BaseModel
from typing import List, Dict, Any

class BorrowerStatsResponse(BaseModel):
    active_cases: int
    funding_progress: float
    pending_tasks: int

class BorrowerActionsResponse(BaseModel):
    actions: List[Dict[str, Any]]
