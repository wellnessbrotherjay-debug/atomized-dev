"""Ingestion Run model."""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer, BigInteger, func
from .base import Base

class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connection_id = Column(String(36), ForeignKey("connections.id"), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True))
    
    status = Column(String(50), default="running")
    rows_loaded = Column(BigInteger)
    bytes_loaded = Column(BigInteger)
    error_message = Column(String)
    
    extended_data = Column(JSON, default={})
