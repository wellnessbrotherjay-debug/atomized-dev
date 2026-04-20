"""Optimization context service."""

from datetime import date
from typing import Dict, List
from sqlalchemy.orm import Session
from ..models.optimization_log import OptimizationLog

def log_optimization(db: Session, tenant_id: str, data: Dict) -> OptimizationLog:
    """Create a new optimization log entry."""
    entry = OptimizationLog(
        tenant_id=tenant_id,
        client_entity_id=data.get("client_entity_id"),
        campaign_id=data.get("campaign_id"),
        campaign_name=data.get("campaign_name"),
        effective_date=data.get("effective_date", date.today()),
        change_type=data.get("change_type"),
        description=data.get("description"),
        extended_data=data.get("metadata", {}),
        created_by=data.get("created_by")
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_recent_optimizations(db: Session, tenant_id: str, limit: int = 5) -> List[OptimizationLog]:
    """Retrieve recent optimization entries for a tenant."""
    return db.query(OptimizationLog).filter(OptimizationLog.tenant_id == tenant_id).order_by(OptimizationLog.effective_date.desc()).limit(limit).all()
