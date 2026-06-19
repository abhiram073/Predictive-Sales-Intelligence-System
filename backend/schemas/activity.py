from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActivityBase(BaseModel):
    action: str
    details: Optional[str] = None
    icon_type: str = "activity"

class ActivityCreate(ActivityBase):
    user_id: Optional[int] = None

class ActivityResponse(ActivityBase):
    id: int
    user_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
