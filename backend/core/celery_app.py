from celery import Celery
from core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.task_routes = {
    "worker.tasks.process_sales_data": "main-queue",
    "worker.tasks.train_models": "ml-queue",
}
