from pydantic import BaseModel
from typing import List, Optional

class TrainRequest(BaseModel):
    dataset_id: int
    model_type: str # 'xgboost', 'prophet', 'random_forest', 'lightgbm', 'auto'
    clean_missing: bool = True
    remove_outliers: bool = True
    generate_features: bool = True

class TrainResponse(BaseModel):
    message: str
    model_path: str
    accuracy: float
    mae: float

class ForecastRequest(BaseModel):
    model_path: str
    dataset_id: int
    horizon_days: int # 7, 30, 90, 180, 365

class ForecastResponse(BaseModel):
    message: str
    records_inserted: int
