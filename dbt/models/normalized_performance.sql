/*
    This model normalizes raw performance metrics from multiple source tables
    (Google Ads, Meta Ads, etc.) into a unified schema for the Intelligence Hub.
*/

{{ config(materialized='view') }}

with raw_meta as (
    select
        date_start as event_date,
        'Facebook' as platform,
        campaign_name,
        spend as cost,
        inline_link_clicks as clicks,
        conversions as leads
    from {{ source('raw_ads', 'meta_performance') }}
),

raw_google as (
    select
        segments_date as event_date,
        'Google' as platform,
        campaign_name,
        metrics_cost_micros / 1000000 as cost,
        metrics_clicks as clicks,
        metrics_conversions as leads
    from {{ source('raw_ads', 'google_performance') }}
),

unified as (
    select * from raw_meta
    union all
    select * from raw_google
)

select
    event_date,
    platform,
    campaign_name,
    cost,
    clicks,
    leads,
    case 
        when leads > 0 then cost / leads 
        else 0 
    end as cpl,
    case 
        when clicks > 0 then cast(leads as float) / clicks 
        else 0 
    end as conversion_rate
from unified
