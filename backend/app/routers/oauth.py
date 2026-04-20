from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import os
import httpx
import json
from datetime import datetime, timedelta
from ..utils.db import SessionLocal
from ..models.connection import Connection
from google_auth_oauthlib.flow import Flow
from google.oauth2 import credentials

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/oauth/google/callback")
GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/analytics.readonly"
]

@router.get("/google/login")
def google_login(tenant_id: str):
    """Initiate Google OAuth flow."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI
    )
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=tenant_id
    )
    return {"url": authorization_url}

@router.get("/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback and save tokens."""
    tenant_id = state
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI
    )
    
    try:
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        # Save or update connection
        connection = db.query(Connection).filter(
            Connection.tenant_id == tenant_id,
            Connection.source_type == "google_ads" # Or determine based on scopes
        ).first()
        
        if not connection:
            connection = Connection(tenant_id=tenant_id, source_type="google_ads")
            db.add(connection)
        
        connection.access_token = creds.token
        connection.refresh_token = creds.refresh_token
        connection.token_expiry = creds.expiry
        connection.status = "active"
        connection.account_label = "Google Ads Account" # Fetch real label later
        
        db.commit()
        
        return RedirectResponse(url=f"http://localhost:3000/dashboard/connections?status=success")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")

# Meta (Facebook) OAuth Configuration
META_CLIENT_ID = os.getenv("META_CLIENT_ID")
META_CLIENT_SECRET = os.getenv("META_CLIENT_SECRET")
META_REDIRECT_URI = os.getenv("META_REDIRECT_URI", "http://localhost:8000/api/oauth/meta/callback")

@router.get("/meta/login")
def meta_login(tenant_id: str):
    """Initiate Meta OAuth flow."""
    url = (
        f"https://www.facebook.com/v19.0/dialog/oauth?"
        f"client_id={META_CLIENT_ID}&"
        f"redirect_uri={META_REDIRECT_URI}&"
        f"state={tenant_id}&"
        f"scope=ads_read,business_management"
    )
    return {"url": url}

@router.get("/meta/callback")
async def meta_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handle Meta OAuth callback."""
    tenant_id = state
    
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_res = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "client_id": META_CLIENT_ID,
                "client_secret": META_CLIENT_SECRET,
                "redirect_uri": META_REDIRECT_URI,
                "code": code
            }
        )
        token_data = token_res.json()
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token from Meta")
        
        # In Meta, we usually want to exchange a short-lived token for a long-lived one
        long_lived_res = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": META_CLIENT_ID,
                "client_secret": META_CLIENT_SECRET,
                "fb_exchange_token": token_data["access_token"]
            }
        )
        long_lived_data = long_lived_res.json()
        access_token = long_lived_data.get("access_token", token_data["access_token"])
        expires_in = long_lived_data.get("expires_in", 3600*24*60) # Default 60 days
        
        connection = db.query(Connection).filter(
            Connection.tenant_id == tenant_id,
            Connection.source_type == "meta_ads"
        ).first()
        
        if not connection:
            connection = Connection(tenant_id=tenant_id, source_type="meta_ads")
            db.add(connection)
            
        connection.access_token = access_token
        connection.token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
        connection.status = "active"
        connection.account_label = "Meta Ads Account"
        
        db.commit()
        
    return RedirectResponse(url=f"http://localhost:3000/dashboard/connections?status=success")
