"""API Router for Source Connections & Ingestion."""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..models.connection import Connection
from ..models.ingestion_run import IngestionRun
from ..utils.db import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/connections", response_model=List[Dict[str, Any]])
def list_connections(tenant_id: str, db: Session = Depends(get_db)):
    """List all source connections for a tenant."""
    connections = db.query(Connection).filter(Connection.tenant_id == tenant_id).all()
    return [
        {
            "id": c.id,
            "source_type": c.source_type,
            "account_label": c.account_label,
            "status": c.status,
            "last_synced_at": c.last_synced_at
        } for c in connections
    ]

@router.post("/connections/create", response_model=Dict[str, Any])
def create_connection(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Create a new data source connection."""
    conn = Connection(
        tenant_id=payload["tenant_id"],
        source_type=payload["source_type"],
        account_label=payload.get("account_label"),
        external_account_id=payload.get("external_account_id"),
        config=payload.get("config", {}),
        status="active" if payload.get("config") else "pending"
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return {"id": conn.id}

@router.post("/connections/{connection_id}/sync")
def trigger_connection_sync(connection_id: str, db: Session = Depends(get_db)):
    """Trigger an immediate sync for a specific connection."""
    conn = db.query(Connection).filter(Connection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Logic to trigger Airbyte or custom ingestion
    return {"message": "Sync triggered", "connection_id": connection_id}

@router.get("/connections/{connection_id}/runs", response_model=List[Dict[str, Any]])
def list_connection_runs(connection_id: str, limit: int = Query(10), db: Session = Depends(get_db)):
    """Fetch sync history for a connection."""
    # Assuming connection_id is stored in ingestion_runs metadata or explicitly
    runs = db.query(IngestionRun).filter(IngestionRun.connection_id == connection_id).order_by(IngestionRun.started_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "status": r.status,
            "rows_loaded": r.rows_loaded,
            "finished_at": r.finished_at
        } for r in runs
    ]
