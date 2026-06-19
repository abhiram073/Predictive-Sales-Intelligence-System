from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"
    is_read: bool = False

class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    user_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
