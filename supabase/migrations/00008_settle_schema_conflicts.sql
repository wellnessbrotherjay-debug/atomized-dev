-- ============================================================================
-- Settle Schema Conflicts — Reconciling Clients vs Tenants & Consolidation
-- Migration: 20260420000008_settle_schema_conflicts.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Optimization Log (Consolidated Strategic History)
-- ----------------------------------------------------------------------------
create table if not exists public.optimization_log (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  client_entity_id   uuid references public.client_entities(id) on delete set null,
  campaign_id        text,
  campaign_name      text,
  effective_date     date not null default current_date,
  change_type        text not null, -- budget_shift, creative_refresh, targeting_update, etc.
  description        text not null,
  metadata           jsonb not null default '{}'::jsonb,
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now()
);

-- Ensure RLS and basic indexing
alter table public.optimization_log enable row level security;
create index if not exists idx_optimization_log_tenant on public.optimization_log(tenant_id, effective_date desc);

-- ----------------------------------------------------------------------------
-- 2. Change Event Registry (Automated Audit Trail)
-- ----------------------------------------------------------------------------
create table if not exists public.change_event_registry (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.tenants(id) on delete cascade,
  source_platform          text not null,
  external_account_id      text,
  external_campaign_id     text,
  external_entity_type     text not null,
  external_entity_id       text not null,
  change_type              text not null,
  changed_fields           jsonb not null default '{}'::jsonb,
  old_values               jsonb,
  new_values               jsonb,
  platform_actor           text,
  platform_event_timestamp timestamptz not null,
  detected_at              timestamptz not null default now(),
  correlation_key          text,
  raw_payload              jsonb
);

-- Ensure RLS and basic indexing
alter table public.change_event_registry enable row level security;
create index if not exists idx_change_events_tenant on public.change_event_registry(tenant_id, platform_event_timestamp desc);

-- ----------------------------------------------------------------------------
-- 3. Unified RLS Policies
-- ----------------------------------------------------------------------------

-- Optimization Log
drop policy if exists "Workspace members see optimization_log" on public.optimization_log;
create policy "Workspace members see optimization_log" on public.optimization_log
  for select using (public.has_tenant_access(tenant_id));

drop policy if exists "Admins manage optimization_log" on public.optimization_log;
create policy "Admins manage optimization_log" on public.optimization_log
  for all using (public.has_tenant_access(tenant_id));

-- Change Event Registry
drop policy if exists "Workspace members see change_events" on public.change_event_registry;
create policy "Workspace members see change_events" on public.change_event_registry
  for select using (public.has_tenant_access(tenant_id));

drop policy if exists "Admins manage change_events" on public.change_event_registry;
create policy "Admins manage change_events" on public.change_event_registry
  for all using (public.has_tenant_access(tenant_id));
