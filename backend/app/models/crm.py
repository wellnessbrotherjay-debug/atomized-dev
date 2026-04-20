"""CRM Models."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Numeric, Enum as SQLEnum, func
from .base import Base
import enum

class LeadStage(enum.Enum):
    new = "new"
    qualified = "qualified"
    pitching = "pitching"
    proposal = "proposal"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"

class ActivityType(enum.Enum):
    call = "call"
    email = "email"
    meeting = "meeting"
    note = "note"
    stage_change = "stage_change"
    automation = "automation"

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    first_name = Column(String(255))
    last_name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    job_title = Column(String(255))
    linkedin_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    contact_id = Column(String(36), ForeignKey("contacts.id"))
    company_name = Column(String(255))
    stage = Column(String(50), default="new")
    value = Column(Numeric(12, 2), default=0)
    source = Column(String(255))
    owner_id = Column(String(36))
    status = Column(String(50), default="active")
    metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AttributionLog(Base):
    __tablename__ = "attribution_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id"), nullable=False)
    utm_source = Column(String(255))
    utm_medium = Column(String(255))
    utm_campaign = Column(String(255))
    utm_term = Column(String(255))
    utm_content = Column(String(255))
    ip_address = Column(String(50))
    user_agent = Column(String(512))
    device_type = Column(String(50))
    browser = Column(String(50))
    os = Column(String(50))
    country = Column(String(100))
    region = Column(String(100))
    city = Column(String(100))
    landing_page = Column(String(1024))
    referrer = Column(String(1024))
    first_touch_at = Column(DateTime(timezone=True), server_default=func.now())
    last_touch_at = Column(DateTime(timezone=True), server_default=func.now())

class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id"), nullable=False)
    actor_id = Column(String(36))
    activity_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    notes = Column(String(4096))
    metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
