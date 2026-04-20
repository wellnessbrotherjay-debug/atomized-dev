"""Connection model."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, func
from .base import Base

class Connection(Base):
    __tablename__ = "connections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    source_type = Column(String(50), nullable=False)
    account_label = Column(String(255))
    external_account_id = Column(String(255))
    vault_secret_ref = Column(String(255))
    airbyte_connection_id = Column(String(255))
    
    config = Column(JSON, default={})
    status = Column(String(50), default="pending")
    
    last_synced_at = Column(DateTime(timezone=True))
    next_sync_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
