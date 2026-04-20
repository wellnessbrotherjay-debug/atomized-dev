"""Agency model."""

import uuid
from sqlalchemy import Column, String, DateTime, func
from .base import Base

class Agency(Base):
    __tablename__ = "agencies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    plan = Column(String(50), default="starter")
    bq_project_id = Column(String(255), nullable=False)
    bq_dataset_prefix = Column(String(255), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
