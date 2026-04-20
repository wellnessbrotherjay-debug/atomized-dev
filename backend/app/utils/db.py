"""Database utilities."""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import os
from dotenv import load_dotenv

load_dotenv()

# Use Supabase/Postgres in production
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marketing_os.db")

is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

engine_args = {}
if is_sqlite:
    engine_args["connect_args"] = {"check_same_thread": False}
    engine_args["poolclass"] = StaticPool

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    from ..models.base import Base
    # import all models to ensure they are registered
    from ..models import (
        agency, tenant, client_entity, connection, ingestion_run, 
        optimization_log, change_event, media_plan, report_template, tasks
    )
    Base.metadata.create_all(bind=engine)
    
    # Manual migration for SQLite to ensure our new bridge column exists
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN workspace_id VARCHAR(36)"))
            conn.commit()
            print("🔧 Migrated local database: Added workspace_id to tenants")
    except Exception as e:
        # Column likely already exists or other non-critical error
        pass
