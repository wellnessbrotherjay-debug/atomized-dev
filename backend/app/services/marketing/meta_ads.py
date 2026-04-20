"""Meta (Facebook) Ads Performance Service."""

import os
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.adsinsights import AdsInsights
from datetime import datetime, timedelta
from typing import List, Dict, Any

class MetaAdsService:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.app_id = os.getenv("META_CLIENT_ID")
        self.app_secret = os.getenv("META_CLIENT_SECRET")
        FacebookAdsApi.init(self.app_id, self.app_secret, self.access_token)

    def get_campaign_performance(self, ad_account_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Fetch campaign performance metrics from Meta Marketing API."""
        if not ad_account_id.startswith('act_'):
            ad_account_id = f'act_{ad_account_id}'
            
        account = AdAccount(ad_account_id)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        params = {
            'time_range': {
                'since': start_date.strftime('%Y-%m-%d'),
                'until': end_date.strftime('%Y-%m-%d'),
            },
            'level': 'campaign',
            'time_increment': 1, # Daily breakdown
        }
        
        fields = [
            AdsInsights.Field.campaign_id,
            AdsInsights.Field.campaign_name,
            AdsInsights.Field.spend,
            AdsInsights.Field.clicks,
            AdsInsights.Field.conversions,
            AdsInsights.Field.impressions,
            AdsInsights.Field.date_start,
        ]
        
        insights = account.get_insights(fields=fields, params=params)
        
        results: List[Dict[str, Any]] = []
        for insight in insights:
            results.append({
                "id": insight[AdsInsights.Field.campaign_id],
                "name": insight[AdsInsights.Field.campaign_name],
                "spend": float(insight[AdsInsights.Field.spend]),
                "clicks": int(insight[AdsInsights.Field.clicks]),
                # Conversions can be complex in Meta (actions array), simplifying for MVP
                "conversions": len(insight.get(AdsInsights.Field.conversions, [])),
                "impressions": int(insight[AdsInsights.Field.impressions]),
                "date": insight[AdsInsights.Field.date_start]
            })
            
        return results
