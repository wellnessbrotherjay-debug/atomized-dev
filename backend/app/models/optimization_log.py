"""Optimization Log model."""

import uuid
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, JSON, func
from .base import Base

class OptimizationLog(Base):
    __tablename__ = "optimization_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    client_entity_id = Column(String(36), nullable=True)
    
    campaign_id = Column(String(255))
    campaign_name = Column(String(255))
    
    effective_date = Column(Date, nullable=False)
    change_type = Column(String(100)) # creative_pause, budget_shift, etc.
    description = Column(String, nullable=False)
    
    extended_data = Column(JSON, default={})
    created_by = Column(String(36))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
