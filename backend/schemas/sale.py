from pydantic import BaseModel
from datetime import date

class SaleBase(BaseModel):
    date: date
    units_sold: int
    revenue: float

class SaleCreate(SaleBase):
    product_id: int

class SaleResponse(SaleBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True
