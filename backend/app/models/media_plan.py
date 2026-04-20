"""Media Plan model."""

import uuid
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, JSON, Float, func
from .base import Base

class MediaPlan(Base):
    __tablename__ = "media_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(String)
    
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    total_budget = Column(Float, default=0.0)
    currency = Column(String(3), default="USD")
    
    status = Column(String(50), default="draft")
    allocations = Column(JSON, default={}) # { "google_ads": 0.4, "meta_ads": 0.6 }
    targets = Column(JSON, default={}) # { "cpa": 25.0, "roas": 4.5 }
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
