"""CRM API Router."""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..utils.db import SessionLocal
from ..services.crm_service import CRMService
from ..models.crm import Lead, Contact, LeadActivity, AttributionLog

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/leads", response_model=Dict[str, Any])
def create_lead(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Capture a new lead with attribution."""
    tenant_id = payload.get("tenant_id")
    lead_data = payload.get("lead")
    attribution_data = payload.get("attribution")
    
    if not tenant_id or not lead_data:
        raise HTTPException(status_code=400, detail="Missing tenant_id or lead data")
        
    lead = CRMService.create_lead(db, tenant_id, lead_data, attribution_data)
    return {"id": lead.id, "status": "created"}

@router.get("/leads", response_model=List[Dict[str, Any]])
def list_leads(tenant_id: str, db: Session = Depends(get_db)):
    """List leads for a tenant."""
    leads = db.query(Lead).filter(Lead.tenant_id == tenant_id).all()
    return [
        {
            "id": l.id,
            "company_name": l.company_name,
            "stage": l.stage,
            "value": float(l.value),
            "source": l.source,
            "created_at": l.created_at
        } for l in leads
    ]

@router.get("/leads/{lead_id}")
def get_lead_details(lead_id: str, db: Session = Depends(get_db)):
    """Get full lead profile, activity, and attribution."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    activities = db.query(LeadActivity).filter(LeadActivity.lead_id == lead_id).order_by(LeadActivity.created_at.desc()).all()
    attribution = db.query(AttributionLog).filter(AttributionLog.lead_id == lead_id).first()
    
    return {
        "lead": {
            "id": lead.id,
            "company": lead.company_name,
            "stage": lead.stage,
            "value": float(lead.value),
            "source": lead.source
        },
        "activities": [
            {
                "type": a.activity_type,
                "title": a.title,
                "notes": a.notes,
                "created_at": a.created_at
            } for a in activities
        ],
        "attribution": {
            "source": attribution.utm_source if attribution else None,
            "medium": attribution.utm_medium if attribution else None,
            "campaign": attribution.utm_campaign if attribution else None,
            "landing_page": attribution.landing_page if attribution else None
        } if attribution else None
    }

@router.patch("/leads/{lead_id}/stage")
def update_stage(lead_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Move lead through the pipeline."""
    new_stage = payload.get("stage")
    notes = payload.get("notes")
    actor_id = payload.get("actor_id")
    
    lead = CRMService.update_lead_stage(db, lead_id, new_stage, actor_id, notes)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    return {"status": "updated", "new_stage": lead.stage}
