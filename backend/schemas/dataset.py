from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DatasetBase(BaseModel):
    original_filename: str
    rows_count: int

class DatasetCreate(DatasetBase):
    filename: str
    file_path: str

class DatasetResponse(DatasetBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ValidateResponse(BaseModel):
    is_valid: bool
    total_rows: int
    missing_values: Dict[str, int]
    invalid_dates: int
    duplicate_records: int
    preview_data: List[Dict[str, Any]]
    date_range: Optional[Dict[str, str]]
    total_products: int
