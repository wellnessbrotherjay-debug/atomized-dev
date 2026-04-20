"""SIGNAL AI Engine — Strategic Narrative Generation."""

import json
from datetime import date
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from .bigquery_service import bigquery_service
from .context_service import get_recent_optimizations
from ..models.tenant import Tenant

class SignalAIEngine:
    """
    Core engine for generating strategist-grade narratives by correlating
    BigQuery performance data with Supabase optimization logs.
    """

    async def generate_campaign_narrative(
        self,
        db: Session,
        tenant_id: str,
        period_start: date,
        period_end: date,
        campaign_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a narrative summary that explains performance shifts 
        using strategic context.
        """
        # 1. Gather Performance Context (Data Warehouse)
        performance_data = self._get_performance_summary(tenant_id, period_start, period_end, campaign_id)
        
        # 2. Gather Human Context (Control Plane)
        optimizations = get_recent_optimizations(db, tenant_id, limit=5)
        
        # 3. Construct Prompt (Context Window Preparation)
        prompt = self._build_prompt(performance_data, optimizations)
        
        # 4. Invoke LLM (Mocked for now, designed for OpenAI/Anthropic)
        narrative = self._generate_mock_narrative(performance_data, optimizations)
        
        # 5. Track Usage (Metering)
        self._log_usage(tenant_id, "ai_tokens", units=450) # Mock units

        return {
            "title": "Strategic Performance Recap",
            "body": narrative,
            "period": f"{period_start} to {period_end}",
            "metrics_captured": performance_data,
            "correlated_events": len(optimizations),
            "metadata": {
                "engine_version": "signal-v1",
                "correlations": [opt.change_type for opt in optimizations]
            }
        }

    def _get_performance_summary(self, tenant_id: str, start: date, end: date, campaign_id: Optional[str]) -> Dict[str, Any]:
        """Fetch and aggregate metrics from BigQuery."""
        query = f"""
            SELECT SUM(spend) as spend, SUM(conversions) as conversions, AVG(roas) as roas
            FROM `fct_daily_campaign_performance`
            WHERE tenant_id = '{tenant_id}'
              AND report_date BETWEEN '{start}' AND '{end}'
        """
        if campaign_id:
            query += f" AND campaign_id = '{campaign_id}'"
            
        results = bigquery_service.run_query(query)
        if not results:
            return {"spend": 0, "conversions": 0, "roas": 0}
            
        return results[0]

    def _build_prompt(self, performance: Dict[str, Any], optimizations: List[Any]) -> str:
        """Synthesize performance and context into a structured prompt."""
        context_str = "\n".join([f"- {opt.effective_date}: {opt.description}" for opt in optimizations])
        return f"""
        Analyze performance for a marketing campaign.
        Metrics: Spend={performance['spend']}, Conversions={performance['conversions']}, ROAS={performance['roas']}
        
        Human Context (Strategic Changes):
        {context_str}
        
        Explain how the human changes likely contributed to the performance outcomes.
        """

    def _generate_mock_narrative(self, performance: Dict[str, Any], optimizations: List[Any]) -> str:
        """Fallback mock narrative generation."""
        if not optimizations:
            return "Performance remained steady this period. No major strategic pivots were recorded to correlate with the data."
            
        top_opt = optimizations[0]
        return (
            f"The increase in conversions observed this period strongly correlates with the {top_opt.change_type} "
            f"implemented on {top_opt.effective_date}. The decision to '{top_opt.description[:100]}...' "
            f"provided the necessary uplift in ROAS ({performance['roas']}x) while maintaining efficient spend."
        )

    def _log_usage(self, tenant_id: str, resource: str, units: int):
        """Internal hook for usage metering (to be fully integrated with Usage model)."""
        print(f"[METERING] Tenant {tenant_id} used {units} {resource}")

# Global instance
signal_ai_engine = SignalAIEngine()
