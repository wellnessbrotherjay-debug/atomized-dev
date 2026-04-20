{{ config(
    materialized='table',
    partition_by={
      "field": "month_start_date",
      "data_type": "date",
      "granularity": "year"
    },
    cluster_by=['tenant_id', 'platform']
) }}

WITH daily_perf AS (
    SELECT
        tenant_id,
        platform,
        campaign_id,
        DATE_TRUNC(report_date, MONTH) as month_start_date,
        SUM(spend) as spend,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions,
        SUM(revenue) as revenue
    FROM {{ ref('fct_daily_campaign_performance') }}
    GROUP BY 1, 2, 3, 4
),

final AS (
    SELECT
        {{ dbt_utils.generate_surrogate_key(['tenant_id', 'platform', 'campaign_id', 'month_start_date']) }} as surrogate_key,
        *,
        CASE WHEN spend > 0 THEN conversions / spend ELSE 0 END as cost_per_conversion,
        CASE WHEN spend > 0 THEN revenue / spend ELSE 0 END as roas,
        CURRENT_TIMESTAMP() as aggregated_at
    FROM daily_perf
)

SELECT * FROM final
