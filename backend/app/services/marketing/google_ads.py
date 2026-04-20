"""Google Ads Performance Service."""

import os
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from datetime import datetime, timedelta
from typing import List, Dict, Any

    def __init__(self, refresh_token: str):
        # In a real app, this would use a more robust credential loading
        credentials = {
            "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN"),
            "refresh_token": refresh_token,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "use_proto_plus": True
        }
        self.client = GoogleAdsClient.load_from_dict(credentials)

    def list_accessible_customers(self) -> List[Dict[str, Any]]:
        """List all Google Ads accounts accessible via the refresh token."""
        customer_service = self.client.get_service("CustomerService")
        try:
            # First, fetch resource names of accessible customers
            accessible_customers = customer_service.list_accessible_customers()
            
            results = []
            for resource_name in accessible_customers.resource_names:
                # For each resource name, we need to fetch the customer object to get the ID/DescriptiveName
                # Note: This often requires fetching from each CID directly
                customer_id = resource_name.split('/')[-1]
                results.append({
                    "id": customer_id,
                    "resource_name": resource_name,
                    "descriptive_name": f"Account {customer_id}" # Simplified for discovery stage
                })
            return results
        except GoogleAdsException as ex:
            print(f"List accessible customers failed: {ex}")
            return []

    def get_campaign_performance(self, customer_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Fetch campaign performance metrics from Google Ads."""
        ga_service = self.client.get_service("GoogleAdsService")
        
        # Calculate date range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        query = f"""
            SELECT
                campaign.id,
                campaign.name,
                metrics.cost_micros,
                metrics.clicks,
                metrics.conversions,
                metrics.impressions,
                segments.date
            FROM campaign
            WHERE segments.date >= '{start_date.isoformat()}'
              AND segments.date <= '{end_date.isoformat()}'
        """
        
        search_request = self.client.get_type("SearchGoogleAdsRequest")
        search_request.customer_id = customer_id
        search_request.query = query

        results: List[Dict[str, Any]] = []
        try:
            stream = ga_service.search_stream(request=search_request)
            for batch in stream:
                for row in batch.results:
                    results.append({
                        "id": str(row.campaign.id),
                        "name": row.campaign.name,
                        "spend": row.metrics.cost_micros / 1000000.0,
                        "clicks": row.metrics.clicks,
                        "conversions": row.metrics.conversions,
                        "impressions": row.metrics.impressions,
                        "date": row.segments.date
                    })
        except GoogleAdsException as ex:
            print(f"Request with ID '{ex.request_id}' failed with status "
                  f"'{ex.error.code().name}' and includes the following errors:")
            for error in ex.failure.errors:
                print(f"\tError with message '{error.message}'.")
                if error.location:
                    for field_path_element in error.location.field_path_elements:
                        print(f"\t\tOn field: {field_path_element.field_name}")
            raise ex
            
        return results
