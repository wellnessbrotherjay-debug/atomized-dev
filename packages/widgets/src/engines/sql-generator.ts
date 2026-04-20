import { KpiTile, TimeSeriesOverlay, Widget } from "../schemas/widget-types";

export interface QueryContext {
  tenant_id: string;
  period_start: string;
  period_end: string;
}

export class SqlGenerator {
  static generate(widget: Widget, context: QueryContext): string {
    switch (widget.type) {
      case "kpi_tile":
        return this.generateKpiQuery(widget as KpiTile, context);
      case "time_series_overlay":
        return this.generateTimeSeriesQuery(widget as TimeSeriesOverlay, context);
      default:
        throw new Error(`Unsupported widget type for SQL generation: ${widget.type}`);
    }
  }

  private static generateKpiQuery(widget: KpiTile, context: QueryContext): string {
    const { metric } = widget.config;
    const { tenant_id, period_start, period_end } = context;

    return `
      SELECT
        SUM(${metric}) as value,
        '${metric}' as metric_name
      FROM \`warehouse.fct_daily_campaign_performance\`
      WHERE tenant_id = '${tenant_id}'
        AND report_date >= '${period_start}'
        AND report_date <= '${period_end}'
    `;
  }

  private static generateTimeSeriesQuery(widget: TimeSeriesOverlay, context: QueryContext): string {
    const { metrics, granularity } = widget.config;
    const { tenant_id, period_start, period_end } = context;

    const date_trunc = granularity === "day" ? "DAY" : granularity === "week" ? "WEEK" : "MONTH";
    const select_metrics = metrics.map(m => `SUM(${m}) as ${m}`).join(", ");

    return `
      SELECT
        DATE_TRUNC(report_date, ${date_trunc}) as period_date,
        ${select_metrics}
      FROM \`warehouse.fct_daily_campaign_performance\`
      WHERE tenant_id = '${tenant_id}'
        AND report_date >= '${period_start}'
        AND report_date <= '${period_end}'
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }
}
