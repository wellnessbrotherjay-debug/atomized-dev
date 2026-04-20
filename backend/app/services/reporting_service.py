"""Reporting service."""

from datetime import date
from typing import Any, Dict, List
from sqlalchemy.orm import Session
from .bigquery_service import bigquery_service
from .context_service import get_recent_optimizations
from ..models.tenant import Tenant

def generate_strategic_narrative(
    db: Session,
    tenant_id: str,
    period_start: date,
    period_end: date
) -> Dict[str, Any]:
    """Generate a context-aware strategic report summary using OptimizationLog."""
    
    # 1. Fetch performance data from BigQuery
    metrics_query = """
    SELECT report_date, spend, conversions, roas
    FROM `performance_table`
    WHERE report_date >= @period_start AND report_date <= @period_end
    """
    params = {
        "period_start": str(period_start),
        "period_end": str(period_end),
    }
    performance_rows = bigquery_service.run_query(metrics_query, params)
    
    # 2. Fetch Human Strategic Context (OptimizationLog)
    optimizations = get_recent_optimizations(db, tenant_id, limit=5)
    
    # 3. Fetch Tenant Brand Config
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    brand_config = tenant.brand_config if tenant else {}
    
    # 4. Synthesize Narrative
    total_spend = sum(row['spend'] for row in performance_rows)
    avg_roas = sum(row['roas'] for row in performance_rows) / len(performance_rows) if performance_rows else 0
    
    # Simple logic: correlate optimizations with performance
    narrative_summary = "Performance this period align with strategic implementation."
    if optimizations:
        narrative_summary = f"Generated insights based on {len(optimizations)} optimization entries, including: {optimizations[0].description[:100]}..."

    return {
        "tenant_id": tenant_id,
        "tenant_name": tenant.name if tenant else "Unknown Tenant",
        "brand_style": brand_config.get("style", "quiet_luxury"),
        "period": f"{period_start} to {period_end}",
        "aggregate_metrics": {
            "total_spend": round(total_spend, 2),
            "avg_roas": round(avg_roas, 2)
        },
        "strategic_recap": [
            {
                "title": f"{opt.change_type} - {opt.effective_date}",
                "reason": opt.description,
                "type": opt.change_type
            } for opt in optimizations
        ],
        "narrative_insight": narrative_summary,
        "raw_data_preview": performance_rows[:5]
    }
