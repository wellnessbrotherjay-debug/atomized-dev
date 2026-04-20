"""API router for tenant management."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models.tenant import Tenant
from ..utils.db import SessionLocal

router = APIRouter(redirect_slashes=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def list_tenants(workspace_id: str = None, db: Session = Depends(get_db)):
    query = db.query(Tenant)
    if workspace_id:
        query = query.filter(Tenant.workspace_id == workspace_id)
    tenants = query.all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "slug": t.slug,
            "created_at": t.created_at,
        }
        for t in tenants
    ]

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_tenant(payload: dict, db: Session = Depends(get_db)):
    name = payload.get("name")
    slug = payload.get("slug")
    workspace_id = payload.get("workspace_id")
    tenant = Tenant(name=name, slug=slug, workspace_id=workspace_id)
    
    # Ensure agency_id is set to satisfy the NOT NULL constraint in local DB
    from ..models.agency import Agency
    agency = db.query(Agency).first()
    if agency:
        tenant.agency_id = agency.id
    else:
        # Fallback if no agency exists at all
        tenant.agency_id = "default-agency-id"
        
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return {
        "id": tenant.id,
        "name": tenant.name,
        "slug": tenant.slug,
        "created_at": tenant.created_at,
    }
