from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
import uuid
from api import deps
from db.models import User
from worker.tasks import process_sales_data

router = APIRouter()

@router.post("/")
async def upload_sales_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user) # Allow all users (including Analysts) to upload
):
    """
    Upload CSV or Excel file containing historical sales data.
    """
    if not file.filename.endswith(('.csv', '.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload CSV or Excel.")

    contents = await file.read()
    task_id = str(uuid.uuid4())
    
    # Dispatch Background Task instead of Celery for native execution
    background_tasks.add_task(process_sales_data, contents, file.filename)
    
    return {
        "message": "File uploaded successfully. Processing in background.",
        "task_id": task_id
    }

@router.get("/status/{task_id}")
def get_upload_status(
    task_id: str,
    current_user: User = Depends(deps.get_current_user)
):
    from core.celery_app import celery_app
    task_result = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    }
