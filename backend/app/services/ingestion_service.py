"""Ingestion service updated for Agency OS."""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from ..models.change_event import ChangeEvent
from ..models.ingestion_run import IngestionRun
from ..models.connection import Connection

from ..services.marketing.google_ads import GoogleAdsService
from ..services.marketing.meta_ads import MetaAdsService
from ..services.marketing.google_analytics import GoogleAnalyticsService
from ..models.campaign import Campaign
from ..models.metrics import Metric

def trigger_ingestion(db: Session, tenant_id: str, platform: str) -> Dict[str, Any]:
    """Trigger real platform data ingestion."""
    
    # 1. Find the connection
    connection = db.query(Connection).filter(
        Connection.tenant_id == tenant_id,
        Connection.source_type == platform,
        Connection.status == "active"
    ).first()
    
    if not connection or not connection.access_token:
        return {"status": "error", "message": "No active connection found"}
    
    # 2. Initialize the Ingestion Run
    run = IngestionRun(
        connection_id=connection.id,
        tenant_id=tenant_id,
        status="running",
        started_at=datetime.utcnow()
    )
    db.add(run)
    db.flush()
    
    try:
        metrics_data = []
        if platform == "google_ads":
            service = GoogleAdsService(connection.refresh_token)
            metrics_data = service.get_campaign_performance(connection.external_account_id)
        elif platform == "meta_ads":
            service = MetaAdsService(connection.access_token)
            metrics_data = service.get_campaign_performance(connection.external_account_id)
        elif platform == "ga4":
            service = GoogleAnalyticsService(connection.refresh_token)
            metrics_data = service.get_property_performance(connection.external_account_id)
            
        rows_upserted = 0
        for item in metrics_data:
            # 3. Handle Campaign (for media platforms)
            campaign_id = None
            if platform in ["google_ads", "meta_ads"]:
                campaign = db.query(Campaign).filter(
                    Campaign.tenant_id == tenant_id,
                    Campaign.name == item["name"]
                ).first()
                
                if not campaign:
                    campaign = Campaign(
                        tenant_id=tenant_id,
                        external_id=item.get("id"),
                        name=item["name"],
                        platform=platform,
                        status="active"
                    )
                    db.add(campaign)
                    db.flush()
                campaign_id = campaign.id
                
            # 4. Upsert Multi-Metrics
            # We map API response keys to standardized metric names
            metric_map = {
                "spend": item.get("spend", 0),
                "clicks": item.get("clicks", 0),
                "conversions": item.get("conversions", 0),
                "impressions": item.get("impressions", 0),
                "sessions": item.get("sessions", 0),
                "active_users": item.get("active_users", 0)
            }
            
            for m_name, m_value in metric_map.items():
                if m_value == 0 and m_name not in ["conversions"]: continue
                
                metric = Metric(
                    tenant_id=tenant_id,
                    campaign_id=campaign_id,
                    layer_type="media" if platform != "ga4" else "digital",
                    metric_name=m_name,
                    metric_value=m_value,
                    period_start=item["date"],
                    period_end=item["date"],
                    source=platform
                )
                db.add(metric)
                rows_upserted += 1
                
        # 5. Finalize the run
        run.status = "success"
        run.finished_at = datetime.utcnow()
        run.rows_loaded = rows_upserted
        
        # Update connection timestamp
        connection.last_synced_at = run.finished_at
        
        db.commit()
        db.refresh(run)
        
        return {
            "run_id": run.id,
            "status": run.status,
            "platform": platform,
            "rows_ingested": run.rows_loaded,
            "finished_at": run.finished_at.isoformat()
        }
    except Exception as e:
        run.status = "failed"
        run.error_message = str(e)
        run.finished_at = datetime.utcnow()
        db.commit()
        return {"status": "error", "message": str(e)}

def get_recent_runs(db: Session, tenant_id: str, limit: int = 5) -> List[IngestionRun]:
    """Retrieve recent ingestion runs for a tenant."""
    return db.query(IngestionRun).filter(IngestionRun.tenant_id == tenant_id).order_by(IngestionRun.started_at.desc()).limit(limit).all()
