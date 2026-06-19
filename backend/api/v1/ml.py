from fastapi import APIRouter, Depends, BackgroundTasks
import uuid
from api import deps
from db.models import User
from worker.tasks import train_models

router = APIRouter()

@router.post("/train")
def trigger_training(
    background_tasks: BackgroundTasks,
    product_id: int = None,
    current_user: User = Depends(deps.get_current_active_admin)
):
    """
    Trigger machine learning models training and evaluation.
    """
    task_id = str(uuid.uuid4())
    background_tasks.add_task(train_models, product_id)
    return {
        "message": "Model training started in background.",
        "task_id": task_id
    }
