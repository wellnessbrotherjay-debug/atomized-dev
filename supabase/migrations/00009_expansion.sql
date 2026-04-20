-- ============================================================================
-- Agency OS Expansion — Phase 1: Infrastructure & Metadata Layer
-- Migration: 20260420000009_expansion.sql
-- ============================================================================

-- 1. Annotations (Chart-level and date-specific notes)
create table if not exists public.annotations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  campaign_id text, -- Can be null for tenant-wide annotations
  date        date not null,
  title       text not null,
  body        text,
  severity    text default 'info', -- info, warning, critical, milestone
  category    text default 'general', -- marketing, business, external
  is_visible_in_reports boolean default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

alter table public.annotations enable row level security;
create index if not exists idx_annotations_tenant_date on public.annotations(tenant_id, date desc);

-- 2. Narrative Library (Reusable AI snippets and approved text)
create table if not exists public.narrative_library (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  category    text not null, -- summary, insight, recommendation
  title       text,
  content     text not null,
  tags        text[],
  is_approved boolean default false,
  approved_by uuid references auth.users(id),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.narrative_library enable row level security;
create index if not exists idx_narrative_library_tenant on public.narrative_library(tenant_id, category);

-- 3. Report Edit History (Audit trail for human tweaks)
create table if not exists public.report_edit_history (
  id          uuid primary key default gen_random_uuid(),
  report_run_id uuid not null references public.report_runs(id) on delete cascade,
  section_id  text not null,
  edited_by   uuid references auth.users(id),
  old_content text,
  new_content text not null,
  edit_type   text default 'manual_refine', -- manual_refine, ai_regeneration
  created_at  timestamptz not null default now()
);

alter table public.report_edit_history enable row level security;
create index if not exists idx_report_edits_run on public.report_edit_history(report_run_id);

-- 4. Audit Logs (System-wide security and change tracking)
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  actor_id    uuid references auth.users(id),
  action      text not null, -- login, data_export, connection_delete, etc.
  entity_type text,
  entity_id   text,
  ip_address  text,
  user_agent  text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
create index if not exists idx_audit_logs_tenant on public.audit_logs(tenant_id, created_at desc);

-- 5. Environmental Events (External market shocks)
create table if not exists public.environmental_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null, -- platform_outage, holiday, competitor_move, algorithm_update
  impact_level text default 'medium',
  description text not null,
  start_date  date not null,
  end_date    date,
  affected_platforms text[], -- ['google_ads', 'meta']
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.environmental_events enable row level security;
create index if not exists idx_env_events_date on public.environmental_events(start_date desc);

-- 6. Event Confirmations (Validated optimization logs)
create table if not exists public.event_confirmations (
  id                 uuid primary key default gen_random_uuid(),
  optimization_log_id uuid not null references public.optimization_log(id) on delete cascade,
  confirmed_by       uuid references auth.users(id),
  is_validated       boolean default false,
  validation_notes   text,
  metric_at_confirmation jsonb,
  created_at         timestamptz not null default now()
);

alter table public.event_confirmations enable row level security;

-- 7. Usage Metering (Token and execution cost tracking)
create table if not exists public.usage_metering (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  resource_type    text not null, -- ai_tokens, bq_bytes_billed, report_generation
  units            bigint not null default 0,
  estimated_cost   numeric(10,6) default 0,
  correlation_id   text, -- ID of the report_run or job
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

alter table public.usage_metering enable row level security;
create index if not exists idx_usage_tenant_date on public.usage_metering(tenant_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Standard RLS Policies (Tenant Scoped)
-- ----------------------------------------------------------------------------

-- Helper function has_tenant_access assumed to exist from previous migration.

create policy "Tenant access for annotations" on public.annotations 
  for all using (public.has_tenant_access(tenant_id));

create policy "Tenant access for narrative_library" on public.narrative_library 
  for all using (public.has_tenant_access(tenant_id));

create policy "Tenant access for report_edit_history" on public.report_edit_history 
  for select using (report_run_id in (select id from public.report_runs where public.has_tenant_access(tenant_id)));

create policy "Tenant access for audit_logs" on public.audit_logs 
  for select using (public.has_tenant_access(tenant_id));

create policy "Global read for environmental_events" on public.environmental_events 
  for select using (true);

create policy "Tenant access for event_confirmations" on public.event_confirmations 
  for all using (optimization_log_id in (select id from public.optimization_log where public.has_tenant_access(tenant_id)));

create policy "Tenant access for usage_metering" on public.usage_metering 
  for select using (public.has_tenant_access(tenant_id));
