-- ============================================================================
-- Agency OS: Master Database Provisioning Script
-- Consolidating Core + Expansion + Reporting Schema
-- ============================================================================

-- 1. EXTENSIONS
create extension if not exists pgcrypto;
create extension if not exists vector;

-- 2. ENUMS
do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'layer_type') then
    create type public.layer_type as enum ('media', 'digital', 'business');
  end if;
  if not exists (select 1 from pg_type where typname = 'change_category') then
    create type public.change_category as enum ('budget', 'creative', 'targeting', 'bidding', 'audience', 'other');
  end if;
end $$;

-- 3. CORE INFRASTRUCTURE
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          public.workspace_role not null default 'member',
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.agencies (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  plan             text not null default 'starter',
  bq_project_id    text not null,
  bq_dataset_prefix text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.tenants (
  id               uuid primary key default gen_random_uuid(),
  agency_id        uuid not null references public.agencies(id) on delete cascade,
  slug             text not null,
  name             text not null,
  brand_config     jsonb not null default '{}',
  default_currency text not null default 'USD',
  default_timezone text not null default 'UTC',
  status           text not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (agency_id, slug)
);

create table if not exists public.client_entities (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  name             text not null,
  entity_type      text not null default 'location',
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

-- 4. CONNECTIONS & INGESTION
create table if not exists public.connections (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  source_type text not null,
  account_label text,
  external_account_id text,
  vault_secret_ref text,
  airbyte_connection_id text,
  config      jsonb default '{}',
  status      text default 'pending',
  last_synced_at timestamptz,
  next_sync_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.ingestion_runs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  connection_id uuid references public.connections(id),
  status      text default 'pending',
  rows_loaded bigint default 0,
  bytes_loaded bigint default 0,
  error_message text,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);

-- 5. PERFORMANCE DATA LAYER
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  name        text not null,
  status      text not null default 'active',
  platform    text,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.metrics (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references public.tenants(id) on delete cascade,
  campaign_id   uuid references public.campaigns(id) on delete set null,
  layer_type    public.layer_type not null,
  metric_name   text not null,
  metric_value  numeric not null,
  period_start  date not null,
  period_end    date not null,
  source        text,
  created_at    timestamptz not null default now()
);

create table if not exists public.optimization_log (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  client_entity_id   uuid references public.client_entities(id) on delete set null,
  campaign_id        text,
  campaign_name      text,
  effective_date     date not null default current_date,
  change_type        text not null,
  description        text not null,
  metadata           jsonb not null default '{}'::jsonb,
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now()
);

-- 6. REPORTING & TEMPLATES
create table if not exists public.report_templates (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  layout_config jsonb default '{}',
  widgets     jsonb default '[]',
  is_default  integer default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.report_widgets (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.report_templates(id) on delete cascade,
  key         text not null,
  widget_type text not null,
  title       text,
  query_definition jsonb,
  render_config jsonb,
  position_config jsonb
);

create table if not exists public.report_runs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  template_id uuid not null references public.report_templates(id) on delete cascade,
  status      text default 'pending',
  snapshot_json jsonb,
  html_url    text,
  pdf_url     text,
  ai_cost_usd numeric(10,4) default 0,
  tokens_used integer default 0,
  generated_at timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

-- 7. EXPANSION & METADATA LAYER
create table if not exists public.annotations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  campaign_id text,
  date        date not null,
  title       text not null,
  body        text,
  severity    text default 'info',
  category    text default 'general',
  is_visible_in_reports boolean default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.narrative_library (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  category    text not null,
  title       text,
  content     text not null,
  tags        text[],
  is_approved boolean default false,
  approved_by uuid references auth.users(id),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.report_edit_history (
  id          uuid primary key default gen_random_uuid(),
  report_run_id uuid not null references public.report_runs(id) on delete cascade,
  section_id  text not null,
  edited_by   uuid references auth.users(id),
  old_content text,
  new_content text not null,
  edit_type   text default 'manual_refine',
  created_at  timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  actor_id    uuid references auth.users(id),
  action      text not null,
  entity_type text,
  entity_id   text,
  ip_address  text,
  user_agent  text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists public.usage_metering (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  resource_type    text not null,
  units            bigint not null default 0,
  estimated_cost   numeric(10,6) default 0,
  correlation_id   text,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

-- 8. FUNCTIONS & RLS
create or replace function public.has_tenant_access(t_id uuid)
returns boolean language plpgsql security definer stable as $$
begin
  return exists (select 1 from public.tenants where id = t_id);
end;
$$;

alter table public.workspaces enable row level security;
alter table public.tenants enable row level security;
alter table public.optimization_log enable row level security;
alter table public.report_runs enable row level security;
alter table public.annotations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.usage_metering enable row level security;

-- Basic Policies
drop policy if exists "Tenant access" on public.tenants;
create policy "Tenant access" on public.tenants for all using (true); -- Refine for production

drop policy if exists "Tenant access for logs" on public.optimization_log;
create policy "Tenant access for logs" on public.optimization_log for all using (public.has_tenant_access(tenant_id));

drop policy if exists "Tenant access for reports" on public.report_runs;
create policy "Tenant access for reports" on public.report_runs for all using (public.has_tenant_access(tenant_id));
