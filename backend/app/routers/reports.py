"""API Router for Agency OS Reporting Engine."""

from datetime import date
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..services.report_engine import report_engine
from ..services.export_service import export_service
from ..models.report_run import ReportRun
from ..utils.db import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/run/{tenant_id}", response_model=Dict[str, Any])
async def create_report_run(
    tenant_id: str,
    template_id: str,
    period_start: date,
    period_end: date,
    db: Session = Depends(get_db)
):
    """
    Trigger a new report generation job.
    """
    try:
        # In a production setup, we would enqueue this as a background job
        run = await report_engine.generate_report_run(
            db, tenant_id, template_id, period_start, period_end
        )
        return {"report_run_id": run.id, "status": run.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/run/{run_id}", response_model=Dict[str, Any])
async def get_report_run(run_id: str, db: Session = Depends(get_db)):
    """
    Fetch the results/status of a specific report run.
    """
    run = db.query(ReportRun).filter(ReportRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Report run not found")
    
    return {
        "id": run.id,
        "status": run.status,
        "generated_at": run.generated_at,
        "snapshot": run.snapshot_json
    }

@router.post("/run/{run_id}/export-pdf")
async def export_report_pdf(run_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Trigger a PDF export for a completed report run.
    """
    run = db.query(ReportRun).filter(ReportRun.id == run_id).first()
    if not run or run.status != "completed":
        raise HTTPException(status_code=400, detail="Report run not ready for export")
    
    # Add to background tasks (scaffolded async handling)
    background_tasks.add_task(export_service.trigger_pdf_export, run)
    
    return {"message": "Export job triggered", "run_id": run_id}
