"""Campaign model for Agency OS."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, func
from .base import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    
    external_id = Column(String(255), unique=True)
    platform = Column(String(50)) # google_ads, meta_ads, etc.
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="active")
    
    metadata = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
