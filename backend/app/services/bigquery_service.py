"""BigQuery service mock."""

from typing import Any, Dict, List, Optional
import random
from datetime import datetime, timedelta

class BigQueryService:
    """Service for executing BigQuery queries (Mock)."""

    def __init__(self) -> None:
        self.project = "mock-project-id"

    def run_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute a SQL query and return mock rows."""
        query_upper = query.upper()
        
        # Determine what kind of data to mock based on query keywords
        if "METRICS" in query_upper or "PERFORMANCE" in query_upper:
            return self._mock_performance_data(params)
        elif "CAMPAIGN" in query_upper:
            return self._mock_campaign_data(params)
        else:
            return []

    def _mock_performance_data(self, params: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        rows = []
        start_str = params.get("period_start", (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"))
        end_str = params.get("period_end", datetime.now().strftime("%Y-%m-%d"))
        
        start_date = datetime.strptime(start_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_str, "%Y-%m-%d")
        delta = (end_date - start_date).days
        
        for i in range(delta + 1):
            report_date = start_date + timedelta(days=i)
            # Create a slight spike for a specific date (mock anomaly)
            spend_multiplier = 2.5 if i == 14 else 1.0
            rows.append({
                "report_date": report_date.strftime("%Y-%m-%d"),
                "spend": round(random.uniform(500, 1000) * spend_multiplier, 2),
                "conversions": random.randint(10, 50),
                "cpc": round(random.uniform(0.5, 2.5), 2),
                "roas": round(random.uniform(2.5, 6.0), 2)
            })
        return rows

    def _mock_campaign_data(self, params: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [
            {"campaign_name": "Q4 Brand Awareness", "spend": 4500.50, "conversions": 120, "roas": 4.2},
            {"campaign_name": "Prospecting - UK - Trust", "spend": 8200.00, "conversions": 340, "roas": 3.8},
            {"campaign_name": "Retargeting - Abandoned Cart", "spend": 1200.30, "conversions": 890, "roas": 12.5},
        ]

# Instantiate a global BigQuery service for reuse
bigquery_service = BigQueryService()
