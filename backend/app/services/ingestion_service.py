"""Ingestion service updated for Agency OS."""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from ..models.change_event import ChangeEvent
from ..models.ingestion_run import IngestionRun
from ..models.connection import Connection

def trigger_ingestion(db: Session, tenant_id: str, platform: str) -> Dict[str, Any]:
    """Simulate a platform data ingestion run and record it in public.ingestion_runs."""
    
    # 1. Find or create a mock connection
    connection = db.query(Connection).filter(
        Connection.tenant_id == tenant_id,
        Connection.source_type == platform
    ).first()
    
    if not connection:
        connection = Connection(
            tenant_id=tenant_id,
            source_type=platform,
            account_label=f"Mock {platform.replace('_', ' ').title()} Account",
            status="active"
        )
        db.add(connection)
        db.flush()
    
    # 2. Initialize the Ingestion Run
    run = IngestionRun(
        connection_id=connection.id,
        tenant_id=tenant_id,
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(run)
    db.flush()
    
    # 3. Simulate change events
    events_data = [
        {
            "type": "budget_change",
            "obj": "Campaign #402",
            "fields": {"daily_budget": "Increased from $500 to $1250"},
            "timestamp": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "type": "creative_update",
            "obj": "Ad Group: Prospecting",
            "fields": {"headline": "Updated to 'Fast Delivery'"},
            "timestamp": datetime.utcnow() - timedelta(days=1)
        }
    ]
    
    created_events = []
    for e in events_data:
        evt = ChangeEvent(
            tenant_id=tenant_id,
            source_platform=platform,
            change_type=e["type"],
            object_type=e["obj"],
            changed_fields=e["fields"],
            platform_event_timestamp=e["timestamp"]
        )
        db.add(evt)
        created_events.append(evt)
    
    # 4. Finalize the run
    run.status = "success"
    run.finished_at = datetime.utcnow()
    run.rows_loaded = len(created_events)
    run.bytes_loaded = 1024 * 1024 * 2 # 2MB mock
    
    # Update connection timestamp
    connection.last_synced_at = run.finished_at
    
    db.commit()
    db.refresh(run)
    
    return {
        "run_id": run.id,
        "status": run.status,
        "platform": platform,
        "events_ingested": run.rows_loaded,
        "finished_at": run.finished_at.isoformat() if run.finished_at else None
    }

def get_recent_runs(db: Session, tenant_id: str, limit: int = 5) -> List[IngestionRun]:
    """Retrieve recent ingestion runs for a tenant."""
    return db.query(IngestionRun).filter(IngestionRun.tenant_id == tenant_id).order_by(IngestionRun.started_at.desc()).limit(limit).all()
