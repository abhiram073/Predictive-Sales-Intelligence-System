from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReportBase(BaseModel):
    name: str
    report_type: str
    format: str
    file_url: str

class ReportCreate(ReportBase):
    user_id: Optional[int] = None

class ReportResponse(ReportBase):
    id: int
    user_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
