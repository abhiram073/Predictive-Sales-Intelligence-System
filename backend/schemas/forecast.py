from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ForecastBase(BaseModel):
    target_date: date
    predicted_sales: float
    model_used: Optional[str] = None
    confidence_score: Optional[float] = None

class ForecastCreate(ForecastBase):
    product_id: int

class ForecastResponse(ForecastBase):
    id: int
    product_id: int
    created_at: datetime

    class Config:
        from_attributes = True
