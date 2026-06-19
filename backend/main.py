from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

from db.session import engine
from db.models import Base
from api.v1.auth import router as auth_router
from api.v1.upload import router as upload_router
from api.v1.ml import router as ml_router
from api.v1.dashboard import router as dashboard_router
from api.v1.products import router as products_router
from api.v1.inventory import router as inventory_router
from api.v1.reports import router as reports_router
from api.v1.notifications import router as notifications_router
from api.v1.search import router as search_router
from api.v1.activities import router as activities_router
from api.v1.forecasting_api import router as forecasting_router

# Create tables for prototyping (In production, rely on Alembic)
Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(upload_router, prefix=f"{settings.API_V1_STR}/upload", tags=["upload"])
app.include_router(ml_router, prefix=f"{settings.API_V1_STR}/ml", tags=["ml"])
app.include_router(dashboard_router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])
app.include_router(products_router, prefix=f"{settings.API_V1_STR}/products", tags=["products"])
app.include_router(inventory_router, prefix=f"{settings.API_V1_STR}/inventory", tags=["inventory"])
app.include_router(reports_router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])
app.include_router(notifications_router, prefix=f"{settings.API_V1_STR}/notifications", tags=["notifications"])
app.include_router(search_router, prefix=f"{settings.API_V1_STR}/search", tags=["search"])
app.include_router(activities_router, prefix=f"{settings.API_V1_STR}/activities", tags=["activities"])
app.include_router(forecasting_router, prefix="/api", tags=["forecasting"])
app.include_router(forecasting_router, prefix=f"{settings.API_V1_STR}/forecasting", tags=["forecasting"])
