import { useState, useCallback } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useReporting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getReportPreview = useCallback(async (tenant_id: string, period_start: string, period_end: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/reports/preview/${tenant_id}?period_start=${period_start}&period_end=${period_end}`
      );
      if (!response.ok) throw new Error("Failed to fetch report preview");
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerReportRun = useCallback(async (tenant_id: string, template_id: string, period_start: string, period_end: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/reports/run/${tenant_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id, period_start, period_end }),
      });
      if (!response.ok) throw new Error("Failed to trigger report run");
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, getReportPreview, triggerReportRun };
}
