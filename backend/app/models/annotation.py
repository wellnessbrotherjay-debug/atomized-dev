"""Annotation model."""

import uuid
from sqlalchemy import Column, String, Date, DateTime, Boolean, text, func, ForeignKey
from .base import Base

class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(String(255), nullable=True)
    date = Column(Date, nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(text, nullable=True)
    severity = Column(String(50), default="info")
    category = Column(String(50), default="general")
    is_visible_in_reports = Column(Boolean, default=True)
    
    created_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
