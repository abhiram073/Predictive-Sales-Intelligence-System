from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db import models
from schemas import report as report_schema

router = APIRouter()

@router.get("/", response_model=List[report_schema.ReportResponse])
def get_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    reports = db.query(models.Report).offset(skip).limit(limit).all()
    return reports

@router.post("/", response_model=report_schema.ReportResponse)
def create_report(report: report_schema.ReportCreate, db: Session = Depends(get_db)):
    # In a real app, this would trigger a background task to generate the PDF/Excel
    db_report = models.Report(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.delete("/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    db_report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(db_report)
    db.commit()
    return {"message": "Report deleted successfully"}
