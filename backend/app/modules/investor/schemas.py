"""Investor module schemas."""
from pydantic import BaseModel
from typing import List, Dict, Any

class PortfolioResponse(BaseModel):
    active_investments: int
    roi: float
    funded_deals: int
    investment_returns: float
