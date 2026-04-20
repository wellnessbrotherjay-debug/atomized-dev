"""Client Entity model."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, func
from .base import Base

class ClientEntity(Base):
    __tablename__ = "client_entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    entity_type = Column(String(50), default="location")
    extended_data = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
