from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryBase(BaseModel):
    current_stock: int = 0
    safety_stock: int = 20
    reorder_point: int = 50
    lead_time_days: int = 7

class InventoryCreate(InventoryBase):
    product_id: int

class InventoryUpdate(BaseModel):
    current_stock: Optional[int] = None
    safety_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    lead_time_days: Optional[int] = None

class InventoryResponse(InventoryBase):
    id: int
    product_id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
