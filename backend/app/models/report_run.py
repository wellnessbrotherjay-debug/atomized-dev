"""Report Run model."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Numeric, Integer, Boolean, func
from .base import Base

class ReportRun(Base):
    __tablename__ = "report_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    template_id = Column(String(36), ForeignKey("report_templates.id"), nullable=False)
    
    status = Column(String(50), default="pending") # pending, processing, completed, failed
    snapshot_json = Column(JSON, nullable=True) # Full resolved data structure
    
    html_url = Column(String(1024), nullable=True)
    pdf_url = Column(String(1024), nullable=True)
    
    ai_cost_usd = Column(Numeric(10, 4), default=0)
    tokens_used = Column(Integer, default=0)
    
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(36), nullable=True)
