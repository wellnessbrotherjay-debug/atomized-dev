{{ config(
    materialized='incremental',
    unique_key='surrogate_key',
    partition_by={
      "field": "report_date",
      "data_type": "date",
      "granularity": "day"
    },
    cluster_by=['tenant_id', 'platform', 'campaign_id']
) }}

WITH source_data AS (
    SELECT
        tenant_id,
        platform,
        campaign_id,
        campaign_name,
        report_date,
        spend,
        impressions,
        clicks,
        conversions,
        revenue,
        -- Add metadata if needed
        metadata
    FROM {{ ref('normalized_performance') }}
    {% if is_incremental() %}
    WHERE report_date >= (SELECT MAX(report_date) FROM {{ this }})
    {% endif %}
),

final AS (
    SELECT
        {{ dbt_utils.generate_surrogate_key(['tenant_id', 'platform', 'campaign_id', 'report_date']) }} as surrogate_key,
        *,
        CASE WHEN impressions > 0 THEN clicks / impressions ELSE 0 END as ctr,
        CASE WHEN clicks > 0 THEN spend / clicks ELSE 0 END as cpc,
        CASE WHEN clicks > 0 THEN conversions / clicks ELSE 0 END as conversion_rate,
        CASE WHEN spend > 0 THEN revenue / spend ELSE 0 END as roas,
        CURRENT_TIMESTAMP() as dbt_updated_at
    FROM source_data
)

SELECT * FROM final
