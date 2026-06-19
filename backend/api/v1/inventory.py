from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db import models
from schemas import inventory as inventory_schema
from schemas import product as product_schema
from pydantic import BaseModel

router = APIRouter()

class InventoryWithProduct(inventory_schema.InventoryResponse):
    product: product_schema.ProductResponse

@router.get("/", response_model=List[InventoryWithProduct])
def get_inventory(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    inventory = db.query(models.Inventory).offset(skip).limit(limit).all()
    return inventory

@router.get("/risk", response_model=List[InventoryWithProduct])
def get_inventory_risk(db: Session = Depends(get_db)):
    # Simple risk logic: current_stock <= reorder_point
    risk_inventory = db.query(models.Inventory).filter(models.Inventory.current_stock <= models.Inventory.reorder_point).all()
    return risk_inventory

@router.put("/{inventory_id}", response_model=inventory_schema.InventoryResponse)
def update_inventory(inventory_id: int, inventory: inventory_schema.InventoryUpdate, db: Session = Depends(get_db)):
    db_inventory = db.query(models.Inventory).filter(models.Inventory.id == inventory_id).first()
    if db_inventory is None:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    
    update_data = inventory.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_inventory, key, value)
        
    db.commit()
    db.refresh(db_inventory)
    return db_inventory
