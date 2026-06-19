import pandas as pd
from io import BytesIO
from core.celery_app import celery_app
from db.session import SessionLocal
from db.models import Product, Sale, Inventory, Forecast
from ml.pipeline import ForecastingPipeline
from datetime import datetime

@celery_app.task
def train_models(product_id: int = None):
    db = SessionLocal()
    try:
        # Fetch sales data
        query = db.query(Sale)
        if product_id:
            query = query.filter(Sale.product_id == product_id)
            
        sales = query.all()
        if not sales:
            return {"status": "error", "message": "No sales data found."}
            
        # Organize by product
        sales_by_product = {}
        for sale in sales:
            if sale.product_id not in sales_by_product:
                sales_by_product[sale.product_id] = []
            sales_by_product[sale.product_id].append({
                'date': sale.date,
                'units_sold': sale.units_sold
            })
            
        results = {}
        for p_id, p_sales in sales_by_product.items():
            df = pd.DataFrame(p_sales)
            if len(df) < 14:
                continue # Skip if not enough data
                
            pipeline = ForecastingPipeline(df)
            best_model_name, model, eval_results = pipeline.train_and_compare()
            
            last_date = pd.to_datetime(df['date'].max())
            future_df = pipeline.generate_forecast(best_model_name, model, last_date, horizon=30)
            
            # Delete old forecasts
            db.query(Forecast).filter(Forecast.product_id == p_id).delete()
            
            # Insert new forecasts
            forecasts_to_insert = []
            for _, row in future_df.iterrows():
                forecasts_to_insert.append(Forecast(
                    product_id=p_id,
                    target_date=row['date'].date(),
                    predicted_sales=float(row['predicted_sales']),
                    model_used=best_model_name
                ))
            db.bulk_save_objects(forecasts_to_insert)
            
            # Update Inventory Recommendations
            inventory = db.query(Inventory).filter(Inventory.product_id == p_id).first()
            if inventory:
                total_forecast_30_days = future_df['predicted_sales'].sum()
                # Basic Reorder Point Calculation: Lead Time Demand + Safety Stock
                # Assuming Lead time is 7 days, so we sum first 7 days
                lead_time_demand = future_df.head(7)['predicted_sales'].sum()
                inventory.reorder_point = int(lead_time_demand + inventory.safety_stock)
            
            results[p_id] = {"best_model": best_model_name, "eval": eval_results[best_model_name]}
            
        db.commit()
        return {"status": "success", "results": results}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@celery_app.task
def process_sales_data(file_content: bytes, filename: str):
    db = SessionLocal()
    try:
        if filename.endswith('.csv'):
            for encoding in ['utf-8', 'utf-8-sig', 'cp1252', 'latin1']:
                try:
                    df = pd.read_csv(BytesIO(file_content), encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                df = pd.read_csv(BytesIO(file_content), encoding='utf-8')
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(BytesIO(file_content))
        else:
            return {"status": "error", "message": "Unsupported file format"}

        # Basic validation
        required_cols = {'sku', 'name', 'category', 'price', 'date', 'units_sold', 'revenue'}
        if not required_cols.issubset(set(df.columns.str.lower())):
            return {"status": "error", "message": f"Missing required columns. Found: {list(df.columns)}"}
        
        # Standardize columns
        df.columns = df.columns.str.lower()
        
        # Data Cleaning: Handle missing values and drop duplicates
        df = df.dropna(subset=['sku', 'date', 'units_sold'])
        df = df.drop_duplicates()
        
        # Group by product to handle inserts
        products_df = df[['sku', 'name', 'category', 'price']].drop_duplicates(subset=['sku'])
        
        for _, row in products_df.iterrows():
            product = db.query(Product).filter(Product.sku == str(row['sku'])).first()
            if not product:
                product = Product(
                    sku=str(row['sku']),
                    name=row['name'],
                    category=row['category'] if pd.notna(row['category']) else "Uncategorized",
                    price=float(row['price'])
                )
                db.add(product)
                db.flush() # To get product.id
                
                # Initialize inventory
                inventory = Inventory(
                    product_id=product.id,
                    current_stock=100, # Mock default
                    safety_stock=20,
                    reorder_point=50
                )
                db.add(inventory)
        
        db.commit()

        # Insert Sales
        sales_to_insert = []
        for _, row in df.iterrows():
            product = db.query(Product).filter(Product.sku == str(row['sku'])).first()
            if product:
                try:
                    sale_date = pd.to_datetime(row['date']).date()
                    sales_to_insert.append(Sale(
                        product_id=product.id,
                        date=sale_date,
                        units_sold=int(row['units_sold']),
                        revenue=float(row['revenue'])
                    ))
                except Exception as e:
                    continue # Skip invalid rows
        
        if sales_to_insert:
            db.bulk_save_objects(sales_to_insert)
            db.commit()

        return {"status": "success", "processed_rows": len(sales_to_insert)}

    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
