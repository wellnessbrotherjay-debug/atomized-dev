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

  const getPerformanceAnalytics = useCallback(async (tenant_id: string, start: string, end: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/performance/${tenant_id}?period_start=${start}&period_end=${end}`);
      if (!response.ok) throw new Error("Failed to fetch performance data");
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAttributionAnalytics = useCallback(async (tenant_id: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/attribution/${tenant_id}`);
      if (!response.ok) throw new Error("Failed to fetch attribution data");
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  return { loading, error, getReportPreview, triggerReportRun, getPerformanceAnalytics, getAttributionAnalytics };
}
