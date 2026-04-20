"""API Router for Admin & Operational Monitoring."""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..models.audit_log import AuditLog
from ..models.usage import UsageMetering
from ..utils.db import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/audit-logs", response_model=List[Dict[str, Any]])
def get_audit_logs(
    tenant_id: str = None, 
    limit: int = Query(50), 
    db: Session = Depends(get_db)
):
    """Retrieve system audit logs, optionally filtered by tenant."""
    query = db.query(AuditLog)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "actor_id": log.actor_id,
            "created_at": log.created_at,
            "metadata": log.extended_data
        } for log in logs
    ]

@router.get("/costs", response_model=Dict[str, Any])
def get_usage_costs(tenant_id: str = None, db: Session = Depends(get_db)):
    """Summary of AI tokens and BigQuery costs."""
    query = db.query(UsageMetering)
    if tenant_id:
        query = query.filter(UsageMetering.tenant_id == tenant_id)
    
    usage = query.all()
    total_cost = sum(float(u.estimated_cost) for u in usage)
    total_tokens = sum(u.units for u in usage if u.resource_type == "ai_tokens")
    
    return {
        "total_estimated_cost_usd": round(total_cost, 4),
        "total_tokens": total_tokens,
        "entry_count": len(usage)
    }

@router.get("/jobs")
def get_job_status():
    """Monitor background processing health."""
    # This would pull from task_queue or BullMQ dashboard data
    return {
        "active_workers": 1,
        "pending_jobs": 0,
        "failed_jobs_last_24h": 0,
        "status": "healthy"
    }
