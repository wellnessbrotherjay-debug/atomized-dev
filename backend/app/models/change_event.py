"""Change Event model."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, func
from .base import Base

class ChangeEvent(Base):
    __tablename__ = "change_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    
    source_platform = Column(String(50), nullable=False) # google_ads, meta_ads, tiktok, ga4
    platform_event_id = Column(String(255))
    platform_event_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    change_type = Column(String(100), nullable=False) # budget_change, creative_update, target_shift
    object_type = Column(String(50)) # campaign, ad_group, creative
    object_id = Column(String(255))
    
    changed_fields = Column(JSON, default={})
    old_value = Column(String)
    new_value = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
