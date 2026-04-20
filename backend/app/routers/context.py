"""API router for optimization log entries."""

from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.context_service import log_optimization, get_recent_optimizations
from ..utils.db import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=Dict)
def create_optimization_entry(payload: Dict, db: Session = Depends(get_db)):
    """Log a new manual optimization entry."""
    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id is required")
    entry = log_optimization(db, tenant_id, payload)
    return {
        "id": entry.id,
        "tenant_id": entry.tenant_id,
        "effective_date": entry.effective_date,
        "change_type": entry.change_type,
        "description": entry.description,
        "created_at": entry.created_at,
    }

@router.get("/{tenant_id}", response_model=List[Dict])
def list_recent_optimizations(tenant_id: str, limit: int = 10, db: Session = Depends(get_db)):
    """List recent optimizations for a tenant."""
    entries = get_recent_optimizations(db, tenant_id, limit=limit)
    return [
        {
            "id": e.id,
            "tenant_id": e.tenant_id,
            "effective_date": e.effective_date,
            "change_type": e.change_type,
            "description": e.description,
            "created_at": e.created_at,
        }
        for e in entries
    ]
