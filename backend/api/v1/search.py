from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any
from db.session import get_db
from db import models

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def global_search(query: str, db: Session = Depends(get_db)):
    results = []
    
    if not query or len(query) < 2:
        return results

    # Search Products
    products = db.query(models.Product).filter(
        or_(
            models.Product.name.ilike(f"%{query}%"),
            models.Product.sku.ilike(f"%{query}%"),
            models.Product.category.ilike(f"%{query}%")
        )
    ).limit(5).all()
    for p in products:
        results.append({"type": "product", "id": p.id, "title": p.name, "subtitle": p.sku, "link": f"/products/{p.id}"})

    # Search Reports
    reports = db.query(models.Report).filter(
        models.Report.name.ilike(f"%{query}%")
    ).limit(5).all()
    for r in reports:
        results.append({"type": "report", "id": r.id, "title": r.name, "subtitle": r.report_type, "link": f"/reports/{r.id}"})

    return results
