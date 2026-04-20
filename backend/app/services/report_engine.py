"""Report Generation Engine — Orchestrating the Report Snapshot."""

import json
from datetime import date
from typing import Any, Dict, List
from sqlalchemy.orm import Session
from .signal_ai_engine import signal_ai_engine
from .bigquery_service import bigquery_service
from ..models.report_template import ReportTemplate, ReportWidget
from ..models.report_run import ReportRun

class ReportEngine:
    """
    Orchestrates the assembly of a report run by resolving templates,
    fetching widget data, and integrating AI narratives.
    """

    async def generate_report_run(
        self,
        db: Session,
        tenant_id: str,
        template_id: str,
        period_start: date,
        period_end: date,
        created_by: str = None
    ) -> ReportRun:
        # 1. Fetch Template
        template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if not template:
            raise ValueError("Template not found")

        # 2. Initialize Report Run Record
        report_run = ReportRun(
            tenant_id=tenant_id,
            template_id=template_id,
            status="processing",
            created_by=created_by
        )
        db.add(report_run)
        db.commit()

        try:
            # 3. Resolve Widgets
            widgets_data = []
            widgets = db.query(ReportWidget).filter(ReportWidget.template_id == template_id).all()
            
            for widget in widgets:
                data = self._resolve_widget(widget, tenant_id, period_start, period_end)
                widgets_data.append({
                    "id": widget.id,
                    "key": widget.key,
                    "type": widget.widget_type,
                    "title": widget.title,
                    "data": data,
                    "render_config": widget.render_config
                })

            # 4. Integrate AI Strategic Narrative
            ai_narrative = await signal_ai_engine.generate_campaign_narrative(
                db, 
                tenant_id, 
                period_start, 
                period_end
            )

            # 5. Assemble Snapshot
            snapshot = {
                "report_id": report_run.id,
                "tenant_id": tenant_id,
                "period": {
                    "start": str(period_start),
                    "end": str(period_end)
                },
                "template_name": template.name,
                "ai_narrative": ai_narrative,
                "widgets": widgets_data,
                "generated_at": date.today().isoformat()
            }

            # 6. Finalize Run Record
            report_run.snapshot_json = snapshot
            report_run.status = "completed"
            report_run.tokens_used = ai_narrative.get("metadata", {}).get("tokens", 0)
            db.commit()

            return report_run

        except Exception as e:
            report_run.status = "failed"
            # In a real app, log the error message to report_run
            db.commit()
            raise e

    def _resolve_widget(self, widget: ReportWidget, tenant_id: str, start: date, end: date) -> Any:
        # Mock logic for resolving widget queries via BigQuery
        print(f"Resolving widget {widget.key} via BigQuery...")
        
        # In a real implementation, this would use a Python version of the SQL Generator
        # we defined in the TypeScript package, or call a shared service.
        query = f"SELECT * FROM performance WHERE tenant_id = '{tenant_id}'"
        return bigquery_service.run_query(query, {"period_start": str(start), "period_end": str(end)})

# Global instance
report_engine = ReportEngine()
