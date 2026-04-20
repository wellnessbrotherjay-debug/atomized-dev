"""API Router for Widget Resolution."""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.report_engine import report_engine
from ..utils.db import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/resolve")
async def resolve_widget(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Resolve a single widget's data.
    """
    tenant_id = payload.get("tenant_id")
    widget_config = payload.get("widget")
    period = payload.get("period", {})

    if not tenant_id or not widget_config:
        raise HTTPException(status_code=400, detail="Missing tenant_id or widget config")

    # This calls the resolution logic inside report_engine for consistency
    try:
        # In a real app, we'd have a standalone WidgetService
        data = report_engine._resolve_widget(
            widget_config, # Mocked as a Dict / SQLAlchemy object wrapper
            tenant_id,
            period.get("start"),
            period.get("end")
        )
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resolve-batch")
async def resolve_widgets_batch(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Resolve multiple widgets in a single request.
    """
    tenant_id = payload.get("tenant_id")
    widgets = payload.get("widgets", [])
    period = payload.get("period", {})

    results = []
    for widget_config in widgets:
        data = report_engine._resolve_widget(
            widget_config,
            tenant_id,
            period.get("start"),
            period.get("end")
        )
        results.append({"id": widget_config.get("id"), "data": data})
    
    return {"results": results}
