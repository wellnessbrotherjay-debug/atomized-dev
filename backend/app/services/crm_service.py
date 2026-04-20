"""CRM Service logic."""

from sqlalchemy.orm import Session
from ..models.crm import Lead, Contact, AttributionLog, LeadActivity, LeadStage
import uuid
from typing import Dict, Any, Optional

class CRMService:
    @staticmethod
    def create_lead(db: Session, tenant_id: str, lead_data: Dict[str, Any], attribution_data: Optional[Dict[str, Any]] = None) -> Lead:
        """Create a new lead with optional attribution."""
        
        # 1. Create or find contact
        email = lead_data.get("email")
        contact = None
        if email:
            contact = db.query(Contact).filter(Contact.tenant_id == tenant_id, Contact.email == email).first()
        
        if not contact:
            contact = Contact(
                tenant_id=tenant_id,
                first_name=lead_data.get("first_name"),
                last_name=lead_data.get("last_name"),
                email=email,
                phone=lead_data.get("phone")
            )
            db.add(contact)
            db.flush()
            
        # 2. Create Lead
        lead = Lead(
            tenant_id=tenant_id,
            contact_id=contact.id,
            company_name=lead_data.get("company_name"),
            stage=lead_data.get("stage", "new"),
            value=lead_data.get("value", 0),
            source=lead_data.get("source"),
            owner_id=lead_data.get("owner_id")
        )
        db.add(lead)
        db.flush()
        
        # 3. Create Attribution Log
        if attribution_data:
            attr = AttributionLog(
                lead_id=lead.id,
                utm_source=attribution_data.get("utm_source"),
                utm_medium=attribution_data.get("utm_medium"),
                utm_campaign=attribution_data.get("utm_campaign"),
                utm_term=attribution_data.get("utm_term"),
                utm_content=attribution_data.get("utm_content"),
                ip_address=attribution_data.get("ip_address"),
                user_agent=attribution_data.get("user_agent"),
                country=attribution_data.get("country"),
                landing_page=attribution_data.get("landing_page")
            )
            db.add(attr)
            
        # 4. Initial Activity
        activity = LeadActivity(
            lead_id=lead.id,
            activity_type="automation",
            title="Lead Created",
            notes=f"Lead created via {lead.source or 'Direct'}"
        )
        db.add(activity)
        
        db.commit()
        db.refresh(lead)
        return lead

    @staticmethod
    def update_lead_stage(db: Session, lead_id: str, new_stage: str, actor_id: Optional[str] = None, notes: Optional[str] = None) -> Lead:
        """Update lead stage and record activity."""
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return None
            
        old_stage = lead.stage
        lead.stage = new_stage
        
        activity = LeadActivity(
            lead_id=lead.id,
            actor_id=actor_id,
            activity_type="stage_change",
            title=f"Stage changed: {old_stage} -> {new_stage}",
            notes=notes
        )
        db.add(activity)
        db.commit()
        db.refresh(lead)
        return lead
