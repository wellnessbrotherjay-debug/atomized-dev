"""Export Service — Rendering and File Generation."""

import json
from typing import Dict, Any
from ..models.report_run import ReportRun

class ExportService:
    """
    Handles rendering snapshots into HTML and exporting to PDF/PPTX.
    This service typically sends tasks to an async worker (Playwright/PptxGenJS).
    """

    async def render_html(self, report_run: ReportRun) -> str:
        """
        Render a report snapshot into a styled HTML string.
        In a real production app, this would use a Jinja2 template or 
        the 'render-service' (Next.js/React).
        """
        snapshot = report_run.snapshot_json
        if not snapshot:
            return "<html><body>No snapshot data found</body></html>"

        # Mock HTML rendering
        return f"""
        <html>
            <head><title>Atomized Report - {snapshot.get('template_name')}</title></head>
            <body style="font-family: sans-serif; padding: 40px; background: #000; color: #fff;">
                <h1>{snapshot.get('template_name')}</h1>
                <p>Period: {snapshot.get('period', {}).get('start')} to {snapshot.get('period', {}).get('end')}</p>
                <section>
                    <h2>Strategic AI Narrative</h2>
                    <p>{snapshot.get('ai_narrative', {}).get('body')}</p>
                </section>
                <section>
                    <h2>Metrics & Widgets</h2>
                    <ul>
                        {''.join([f"<li>{w.get('title')}: {len(w.get('data', []))} rows</li>" for w in snapshot.get('widgets', [])])}
                    </ul>
                </section>
            </body>
        </html>
        """

    async def trigger_pdf_export(self, report_run: ReportRun):
        """
        Enqueue a PDF generation job.
        """
        # This would call the Queue system (e.g. BullMQ or a Python worker)
        print(f"[EXPORT] Enqueuing PDF export for report run {report_run.id}")
        # In a production setup, we return a job_id

# Global instance
export_service = ExportService()
