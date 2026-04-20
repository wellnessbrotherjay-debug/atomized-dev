"""Google Analytics 4 (GA4) Service."""

import os
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)
from google.oauth2 import credentials
from typing import List, Dict, Any

class GoogleAnalyticsService:
    def __init__(self, refresh_token: str):
        creds = credentials.Credentials(
            token=None,
            refresh_token=refresh_token,
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            token_uri="https://oauth2.googleapis.com/token"
        )
        self.client = BetaAnalyticsDataClient(credentials=creds)

    def get_property_performance(self, property_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Fetch basic traffic performance from GA4."""
        request = RunReportRequest(
            property=f"properties/{property_id}",
            dimensions=[Dimension(name="date"), Dimension(name="sessionSource")],
            metrics=[
                Metric(name="sessions"),
                Metric(name="activeUsers"),
                Metric(name="conversions"),
                Metric(name="bounceRate")
            ],
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
        )

        response = self.client.run_report(request)
        
        results = []
        for row in response.rows:
            results.append({
                "date": row.dimension_values[0].value,
                "source": row.dimension_values[1].value,
                "sessions": int(row.metric_values[0].value),
                "active_users": int(row.metric_values[1].value),
                "conversions": float(row.metric_values[2].value),
                "bounce_rate": float(row.metric_values[3].value)
            })
            
        return results

    def list_accessible_properties(self) -> List[Dict[str, Any]]:
        """
        List all GA4 properties. 
        Note: Requires Google Analytics Admin API if using a specialized client,
        but we can fetch via the account summary flow.
        """
        # For simplicity in this implementation, we return a scaffold 
        # listing properties requires higher level Analytics Admin API
        return [{"id": "PROPERTY_ID", "name": "Default Property"}]
