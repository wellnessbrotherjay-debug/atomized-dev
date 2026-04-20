"""Metric model for Agency OS."""

import uuid
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Numeric, func
from .base import Base

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    campaign_id = Column(String(36), ForeignKey("campaigns.id"))
    
    layer_type = Column(String(50)) # media, digital, sales
    metric_name = Column(String(100), nullable=False) # spend, clicks, conversions, etc.
    metric_value = Column(Numeric(18, 4), default=0.0)
    
    # Context
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    source = Column(String(50)) # google_ads, meta_ads, ga4
    
    # Granularity
    country = Column(String(100))
    device = Column(String(50)) # desktop, mobile, tablet
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
