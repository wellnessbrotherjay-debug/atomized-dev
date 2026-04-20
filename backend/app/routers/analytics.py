"""Analytics Router for unified performance reporting."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import List, Dict, Any
from ..utils.db import SessionLocal
from ..models.metrics import Metric
from ..models.campaign import Campaign

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/performance/{tenant_id}")
def get_performance_summary(
    tenant_id: str,
    period_start: date = Query(default=date.today() - timedelta(days=30)),
    period_end: date = Query(default=date.today()),
    db: Session = Depends(get_db)
):
    """
    Unified performance data across all sources (Media + Digital).
    Aggregates metrics by day for charting.
    """
    # Query metrics and aggregate by date
    results = db.query(
        Metric.period_start.label("date"),
        Metric.metric_name,
        func.sum(Metric.metric_value).label("value")
    ).filter(
        Metric.tenant_id == tenant_id,
        Metric.period_start >= period_start,
        Metric.period_start <= period_end
    ).group_by(
        Metric.period_start,
        Metric.metric_name
    ).all()

    # Pivot data for chart JS format: [{ date: '...', spend: X, leads: Y, ... }]
    pivoted: Dict[str, Dict[str, Any]] = {}
    
    for r in results:
        date_str = r.date.isoformat()
        if date_str not in pivoted:
            pivoted[date_str] = {"date": date_str}
        pivoted[date_str][r.metric_name] = float(r.value)

    # Sort by date
    chart_data = sorted(list(pivoted.values()), key=lambda x: x["date"])
    
    # Calculate CPL (Cost Per Lead/Conversion) if spend and conversions exist
    for day in chart_data:
        spend = day.get("spend", 0)
        conv = day.get("conversions", 0)
        day["cpl"] = spend / conv if conv > 0 else 0
        day["leads"] = conv # Alias for the frontend's 'leads' label

    return chart_data

@router.get("/attribution/{tenant_id}")
def get_attribution_summary(tenant_id: str, db: Session = Depends(get_db)):
    """Summary of leads by source for the traffic chart."""
    from ..models.crm import Lead
    
    results = db.query(
        Lead.source,
        func.count(Lead.id).label("count")
    ).filter(
        Lead.tenant_id == tenant_id
    ).group_by(Lead.source).all()
    
    return [{"source": r.source or "Unknown", "count": r.count} for r in results]
