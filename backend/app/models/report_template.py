"""Report Template model."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer, func
from .base import Base

class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(String)
    
    layout_config = Column(JSON, default={}) # Standardized grid or page layout
    widgets = Column(JSON, default=[]) # List of widget definitions
    
    is_default = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ReportWidget(Base):
    __tablename__ = "report_widgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String(36), ForeignKey("report_templates.id"), nullable=False)
    
    key = Column(String(100), nullable=False) # e.g. "top_campaigns_chart"
    widget_type = Column(String(50), nullable=False) # chart, narrative, table, kpi_card
    
    title = Column(String(255))
    query_definition = Column(JSON) # Instructions for BigQuery service
    render_config = Column(JSON) # Color schemes, chart types
    position_config = Column(JSON) # x, y, width, height
