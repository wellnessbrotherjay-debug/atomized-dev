"""Token Refresh Service for Marketing APIs."""

import os
import httpx
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.connection import Connection

class TokenService:
    @staticmethod
    async def refresh_google_token(db: Session, connection: Connection) -> str:
        """Refresh Google OAuth access token using refresh_token."""
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "refresh_token": connection.refresh_token,
                    "grant_type": "refresh_token"
                }
            )
            data = res.json()
            
            if "access_token" not in data:
                print(f"Failed to refresh Google token for connection {connection.id}: {data}")
                connection.status = "error"
                db.commit()
                return None
            
            # Update connection
            connection.access_token = data["access_token"]
            expires_in = data.get("expires_in", 3600)
            connection.token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
            db.commit()
            
            return connection.access_token

    @staticmethod
    async def ensure_active_token(db: Session, connection: Connection) -> str:
        """Check if token is expired and refresh if necessary."""
        if not connection.token_expiry or connection.token_expiry <= datetime.utcnow() + timedelta(minutes=5):
            if connection.source_type == "google_ads" and connection.refresh_token:
                return await TokenService.refresh_google_token(db, connection)
            # Add Meta logic here if needed (Meta tokens are usually long-lived, 60 days)
        return connection.access_token

token_service = TokenService()
