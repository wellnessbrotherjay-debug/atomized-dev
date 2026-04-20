"""Usage Metering model."""

import uuid
from sqlalchemy import Column, String, BigInteger, Numeric, DateTime, JSON, func, ForeignKey
from .base import Base

class UsageMetering(Base):
    __tablename__ = "usage_metering"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    resource_type = Column(String(100), nullable=False) # ai_tokens, bq_bytes_billed, report_generation
    units = Column(BigInteger, default=0)
    estimated_cost = Column(Numeric(10, 6), default=0)
    correlation_id = Column(String(255), nullable=True) # Linked report_run_id or job_id
    extended_data = Column(JSON, nullable=False, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
