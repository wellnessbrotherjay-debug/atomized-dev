import { z } from "zod";

export const BaseWidgetSchema = z.object({
  id: z.string(),
  type: z.enum([
    "kpi_tile",
    "time_series_overlay",
    "comparison_table",
    "campaign_card",
    "ai_narrative",
    "markdown_block",
    "bar_chart",
    "pie_chart",
    "funnel",
    "section_group",
  ]),
  title: z.string().optional(),
  description: z.string().optional(),
  config: z.record(z.string(), z.any()).default({}),
});

export const KpiTileSchema = BaseWidgetSchema.extend({
  type: z.literal("kpi_tile"),
  config: z.object({
    metric: z.string(),
    compare_to: z.enum(["previous_period", "previous_year"]).optional(),
    show_trend: z.boolean().default(true),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  }),
});

export const TimeSeriesOverlaySchema = BaseWidgetSchema.extend({
  type: z.literal("time_series_overlay"),
  config: z.object({
    metrics: z.array(z.string()),
    granularity: z.enum(["day", "week", "month"]).default("day"),
    show_historical: z.boolean().default(false),
  }),
});

export type Widget = z.infer<typeof BaseWidgetSchema>;
export type KpiTile = z.infer<typeof KpiTileSchema>;
export type TimeSeriesOverlay = z.infer<typeof TimeSeriesOverlaySchema>;
