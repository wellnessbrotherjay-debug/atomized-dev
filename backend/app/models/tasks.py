"""Task model."""

import uuid
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, JSON, func
from .base import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(String)
    status = Column(String(50), default="todo")
    priority = Column(String(50), default="medium")
    due_date = Column(Date)
    
    owner_user_id = Column(String(36))
    related_object = Column(JSON) # { "type": "decision_context", "id": "uuid" }
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
