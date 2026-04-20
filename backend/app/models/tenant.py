"""Tenant model."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, func
from .base import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agency_id = Column(String(36), ForeignKey("agencies.id"), nullable=True) # Now optional
    workspace_id = Column(String(36), nullable=True) # Simple bridge (no strict FK needed)
    slug = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    
    brand_config = Column(JSON, default={})
    default_currency = Column(String(3), default="USD")
    default_timezone = Column(String(50), default="UTC")
    status = Column(String(50), default="active")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
