from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db import models
from schemas import activity as activity_schema

router = APIRouter()

@router.get("/", response_model=List[activity_schema.ActivityResponse])
def get_activities(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    activities = db.query(models.Activity).order_by(models.Activity.created_at.desc()).offset(skip).limit(limit).all()
    return activities

@router.post("/", response_model=activity_schema.ActivityResponse)
def create_activity(activity: activity_schema.ActivityCreate, db: Session = Depends(get_db)):
    db_activity = models.Activity(**activity.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity
