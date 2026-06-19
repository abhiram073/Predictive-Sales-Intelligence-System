from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db import models
from schemas import notification as notification_schema

router = APIRouter()

@router.get("/", response_model=List[notification_schema.NotificationResponse])
def get_notifications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    notifications = db.query(models.Notification).order_by(models.Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.post("/", response_model=notification_schema.NotificationResponse)
def create_notification(notification: notification_schema.NotificationCreate, db: Session = Depends(get_db)):
    db_notif = models.Notification(**notification.model_dump())
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

@router.put("/{notif_id}/read", response_model=notification_schema.NotificationResponse)
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    db_notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if db_notif is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db_notif.is_read = True
    db.commit()
    db.refresh(db_notif)
    return db_notif

@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/{notif_id}")
def delete_notification(notif_id: int, db: Session = Depends(get_db)):
    db_notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if db_notif is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(db_notif)
    db.commit()
    return {"message": "Notification deleted successfully"}
