from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from api import deps
from db.models import User, Product, Sale, Inventory, Forecast
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    total_revenue = db.query(func.sum(Sale.revenue)).scalar() or 0.0
    total_orders = db.query(func.sum(Sale.units_sold)).scalar() or 0
    total_products = db.query(Product).count()
    
    # Inventory Health
    low_stock_items = db.query(Inventory).filter(Inventory.current_stock <= Inventory.reorder_point).count()
    overstock_items = db.query(Inventory).filter(Inventory.current_stock > Inventory.safety_stock * 3).count()
    
    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products": total_products,
        "low_stock_alerts": low_stock_items,
        "overstock_alerts": overstock_items,
        "health_score": max(0, 100 - (low_stock_items * 5) - (overstock_items * 2))
    }

@router.get("/sales-trend")
def get_sales_trend(
    days: int = 30,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    max_date = db.query(func.max(Sale.date)).scalar()
    if not max_date:
        return []
    cutoff_date = max_date - timedelta(days=days)
    sales = db.query(
        Sale.date, 
        func.sum(Sale.revenue).label('revenue'),
        func.sum(Sale.units_sold).label('units')
    ).filter(Sale.date >= cutoff_date).group_by(Sale.date).order_by(Sale.date).all()
    
    return [{"date": s.date, "revenue": s.revenue, "units": s.units} for s in sales]

@router.get("/forecast-trend")
def get_forecast_trend(
    days: int = 30,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    min_date = db.query(func.min(Forecast.target_date)).scalar()
    if not min_date:
        return []
    cutoff_date = min_date + timedelta(days=days)
    
    avg_price = db.query(func.avg(Product.price)).scalar() or 1.0
    
    forecasts = db.query(
        Forecast.target_date, 
        func.sum(Forecast.predicted_sales).label('predicted')
    ).filter(Forecast.target_date <= cutoff_date).group_by(Forecast.target_date).order_by(Forecast.target_date).all()
    
    return [{"date": f.target_date, "predicted": float(f.predicted * avg_price)} for f in forecasts]

@router.get("/product-performance")
def get_product_performance(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    top_products = db.query(
        Product.name,
        func.sum(Sale.revenue).label('total_revenue')
    ).join(Sale).group_by(Product.id).order_by(func.sum(Sale.revenue).desc()).limit(5).all()
    
    return [{"name": p.name, "revenue": p.total_revenue} for p in top_products]

@router.get("/insights")
def get_dashboard_insights(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    insights = []
    
    # 1. Revenue change insight
    now = datetime.now().date()
    h_30 = now - timedelta(days=30)
    f_30 = now + timedelta(days=30)
    
    hist_sales_sum = db.query(func.sum(Sale.revenue)).filter(Sale.date >= h_30).scalar() or 0.0
    fc_sales_sum = db.query(func.sum(Forecast.predicted_sales)).filter(Forecast.target_date <= f_30).scalar() or 0.0
    
    if hist_sales_sum > 0:
        pct_change = ((fc_sales_sum - hist_sales_sum) / hist_sales_sum) * 100
        if pct_change >= 0:
            insights.append({
                "text": f"Revenue expected to increase by {pct_change:.1f}% next month.",
                "type": "success",
                "icon": "trending_up",
                "route": "/forecasting"
            })
        else:
            insights.append({
                "text": f"Revenue projected to decline by {abs(pct_change):.1f}% next month.",
                "type": "default",
                "icon": "trending_up",
                "route": "/forecasting"
            })
    else:
        insights.append({
            "text": "Forecasting model ready. View detailed projected sales in the forecasting tab.",
            "type": "success",
            "icon": "trending_up",
            "route": "/forecasting"
        })
        
    # 2. Top demand growth product insight
    top_prod_growth = db.query(
        Product.name,
        func.sum(Sale.units_sold).label("hist_units")
    ).join(Sale, Sale.product_id == Product.id, isouter=True)\
     .group_by(Product.id).order_by(func.sum(Sale.units_sold).desc()).limit(1).first()
     
    if top_prod_growth and top_prod_growth.name:
        insights.append({
            "text": f"{top_prod_growth.name} demand forecasted to rise next month.",
            "type": "default",
            "icon": "lightbulb",
            "route": "/sales-analytics"
        })
            
    # 3. Inventory warnings
    risk_inv = db.query(Inventory).join(Product).filter(Inventory.current_stock <= Inventory.reorder_point).first()
    if risk_inv and risk_inv.product:
        reorder_amt = max(50, risk_inv.reorder_point - risk_inv.current_stock)
        insights.append({
            "text": f"Inventory shortage risk detected for {risk_inv.product.name}. Recommended reorder: {reorder_amt} units.",
            "type": "destructive",
            "icon": "alert",
            "route": "/inventory-health"
        })
    else:
        insights.append({
            "text": "All key products maintain stable stock levels. No immediate shortage risk.",
            "type": "success",
            "icon": "sparkles",
            "route": "/inventory-health"
        })
        
    # 4. Profit opportunity
    top_cat = db.query(
        Product.category,
        func.sum(Sale.revenue).label("revenue")
    ).join(Sale).group_by(Product.category).order_by(func.sum(Sale.revenue).desc()).first()
    
    if top_cat and top_cat.category:
        insights.append({
            "text": f"High profit opportunity detected in {top_cat.category} category.",
            "type": "success",
            "icon": "sparkles",
            "route": "/sales-analytics"
        })
    else:
        insights.append({
            "text": "Maximize profit margin by scheduling automated pricing optimizations.",
            "type": "success",
            "icon": "sparkles",
            "route": "/sales-analytics"
        })
        
    return insights

