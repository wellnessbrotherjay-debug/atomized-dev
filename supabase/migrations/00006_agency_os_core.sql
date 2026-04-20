-- ============================================================================
-- Agency OS — Supabase (Postgres) Control Plane Schema
-- Migration: 20260419000006_agency_core_schema.sql
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ----------------------------------------------------------------------------
-- 1. Agencies
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. Tenants
-- ----------------------------------------------------------------------------
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
create index if not exists idx_tenants_agency_id on public.tenants(agency_id);

-- ----------------------------------------------------------------------------
-- 3. Client sub-entities
-- ----------------------------------------------------------------------------
create table if not exists public.client_entities (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  name             text not null,
  entity_type      text not null default 'location',
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);
create index if not exists idx_client_entities_tenant_id on public.client_entities(tenant_id);

-- ----------------------------------------------------------------------------
-- 4. Data source connections
-- ----------------------------------------------------------------------------
create table if not exists public.connections (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  source_type          text not null,
  account_label        text,
  external_account_id  text,
  vault_secret_ref     text,
  airbyte_connection_id text,
  config               jsonb not null default '{}',
  status               text not null default 'pending',
  last_synced_at       timestamptz,
  next_sync_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_connections_tenant_id on public.connections(tenant_id);
create index if not exists idx_connections_status_sync on public.connections(status, next_sync_at);

-- ----------------------------------------------------------------------------
-- 5. Ingestion run audit
-- ----------------------------------------------------------------------------
create table if not exists public.ingestion_runs (
  id             uuid primary key default gen_random_uuid(),
  connection_id  uuid not null references public.connections(id) on delete cascade,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  status         text not null default 'running',
  rows_loaded    bigint,
  bytes_loaded   bigint,
  error_message  text,
  metadata       jsonb not null default '{}'
);
create index if not exists idx_ingestion_runs_tenant on public.ingestion_runs(tenant_id, started_at desc);
create index if not exists idx_ingestion_runs_connection on public.ingestion_runs(connection_id, started_at desc);

-- ----------------------------------------------------------------------------
-- 6. Widgets catalog
-- ----------------------------------------------------------------------------
create table if not exists public.widgets_catalog (
  id                 text primary key,
  name               text not null,
  description        text,
  config_schema      jsonb not null default '{}',
  category           text,
  is_ai_powered      boolean not null default false,
  min_data_points    integer not null default 0,
  version            text not null default '1.0.0'
);

-- ----------------------------------------------------------------------------
-- 7. Report templates
-- ----------------------------------------------------------------------------
create table if not exists public.report_templates (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  tenant_id   uuid references public.tenants(id) on delete cascade,
  name        text not null,
  version     text not null default '1.0.0',
  layout      jsonb not null default '[]',
  parameters  jsonb not null default '{}',
  status      text not null default 'draft',
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_report_templates_agency on public.report_templates(agency_id);

-- ----------------------------------------------------------------------------
-- 8. Report instances
-- ----------------------------------------------------------------------------
create table if not exists public.report_instances (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  template_id        uuid not null references public.report_templates(id),
  name               text not null,
  parameters         jsonb not null default '{}',
  schedule           text,
  last_generated_at  timestamptz,
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now()
);
create index if not exists idx_report_instances_tenant on public.report_instances(tenant_id);

-- ----------------------------------------------------------------------------
-- 9. Report runs
-- ----------------------------------------------------------------------------
create table if not exists public.report_runs (
  id                   uuid primary key default gen_random_uuid(),
  report_instance_id   uuid not null references public.report_instances(id) on delete cascade,
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  snapshot             jsonb not null default '{}',
  template_version     text not null,
  html_url             text,
  pdf_url              text,
  ai_tokens_in         integer not null default 0,
  ai_tokens_out        integer not null default 0,
  ai_cost_usd          numeric(10,4) not null default 0,
  bq_bytes_billed      bigint not null default 0,
  generated_at         timestamptz not null default now(),
  generated_by         uuid references auth.users(id),
  shared_with_client   boolean not null default false,
  client_view_token    uuid unique default gen_random_uuid()
);
create index if not exists idx_report_runs_tenant on public.report_runs(tenant_id, generated_at desc);

-- ----------------------------------------------------------------------------
-- 10. Insights cache
-- ----------------------------------------------------------------------------
create table if not exists public.insights_cache (
  id              bigserial primary key,
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  prompt_hash     text not null,
  model           text not null,
  response        text not null,
  tokens_in       integer not null default 0,
  tokens_out      integer not null default 0,
  cost_usd        numeric(10,6) not null default 0,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz,
  unique (tenant_id, prompt_hash, model)
);
create index if not exists idx_insights_cache_tenant on public.insights_cache(tenant_id, prompt_hash);

-- ----------------------------------------------------------------------------
-- 11. Widget results cache
-- ----------------------------------------------------------------------------
create table if not exists public.widget_results_cache (
  cache_key   text primary key,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  result      jsonb not null,
  bytes_billed bigint not null default 0,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index if not exists idx_widget_results_cache_tenant on public.widget_results_cache(tenant_id);

-- ----------------------------------------------------------------------------
-- 12. Optimization log
-- ----------------------------------------------------------------------------
create table if not exists public.optimization_log (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  client_entity_id   uuid references public.client_entities(id) on delete set null,
  campaign_id        text,
  campaign_name      text,
  effective_date     date not null,
  change_type        text,
  description        text not null,
  metadata           jsonb not null default '{}',
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now()
);
create index if not exists idx_optimization_log_tenant on public.optimization_log(tenant_id, effective_date desc);

-- ----------------------------------------------------------------------------
-- 13. Creative asset embeddings
-- ----------------------------------------------------------------------------
create table if not exists public.creative_embeddings (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  creative_id    text not null,
  source         text not null,
  embedding      vector(768),
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  unique (tenant_id, source, creative_id)
);
create index if not exists idx_creative_embeddings_v on public.creative_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ----------------------------------------------------------------------------
-- 14. Auth / RBAC
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.role_name as enum ('agency_owner', 'agency_admin', 'agency_analyst', 'client_viewer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.memberships (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  agency_id       uuid references public.agencies(id) on delete cascade,
  tenant_id       uuid references public.tenants(id) on delete cascade,
  role            public.role_name not null,
  invited_email   text,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  unique (user_id, agency_id, tenant_id)
);

-- ----------------------------------------------------------------------------
-- 15. Helper functions for RLS
-- ----------------------------------------------------------------------------
create or replace function public.auth_user_tenants()
returns setof uuid
language sql stable security definer
as $$
  select tenant_id from public.memberships
   where user_id = auth.uid() and status = 'active' and tenant_id is not null;
$$;

create or replace function public.auth_user_agencies()
returns setof uuid
language sql stable security definer
as $$
  select agency_id from public.memberships
   where user_id = auth.uid() and status = 'active' and agency_id is not null;
$$;

create or replace function public.has_tenant_access(p_tenant uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.memberships
     where user_id = auth.uid()
       and status = 'active'
       and (tenant_id = p_tenant
         or agency_id in (select agency_id from public.tenants where id = p_tenant))
  );
$$;

-- ----------------------------------------------------------------------------
-- RLS POLICIES
-- ----------------------------------------------------------------------------
alter table public.agencies            enable row level security;
alter table public.tenants             enable row level security;
alter table public.client_entities     enable row level security;
alter table public.connections         enable row level security;
alter table public.ingestion_runs      enable row level security;
alter table public.report_templates    enable row level security;
alter table public.report_instances    enable row level security;
alter table public.report_runs         enable row level security;
alter table public.insights_cache      enable row level security;
alter table public.widget_results_cache enable row level security;
alter table public.optimization_log    enable row level security;
alter table public.creative_embeddings enable row level security;
alter table public.memberships         enable row level security;
alter table public.widgets_catalog     enable row level security;

-- Widgets catalog read policy
drop policy if exists widgets_catalog_read on public.widgets_catalog;
create policy widgets_catalog_read on public.widgets_catalog
  for select using (auth.role() = 'authenticated');

-- Agencies policy
drop policy if exists agencies_select on public.agencies;
create policy agencies_select on public.agencies
  for select using (id in (select public.auth_user_agencies()));

-- Tenants policies
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants
  for select using (
    agency_id in (select public.auth_user_agencies())
    or id in (select public.auth_user_tenants())
  );

drop policy if exists tenants_write on public.tenants;
create policy tenants_write on public.tenants
  for all using (
    exists (select 1 from public.memberships
             where user_id = auth.uid()
               and agency_id = tenants.agency_id
               and role in ('agency_owner', 'agency_admin')
               and status = 'active')
  );

-- Generic rw policies using helper
create policy client_entities_rw on public.client_entities for all using (public.has_tenant_access(tenant_id));
create policy connections_rw on public.connections for all using (public.has_tenant_access(tenant_id));
create policy ingestion_runs_rw on public.ingestion_runs for all using (public.has_tenant_access(tenant_id));
create policy report_templates_rw on public.report_templates for all using (agency_id in (select public.auth_user_agencies()) or (tenant_id is not null and public.has_tenant_access(tenant_id)));
create policy report_instances_rw on public.report_instances for all using (public.has_tenant_access(tenant_id));
create policy report_runs_rw on public.report_runs for all using (public.has_tenant_access(tenant_id));
create policy insights_cache_rw on public.insights_cache for all using (public.has_tenant_access(tenant_id));
create policy widget_results_cache_rw on public.widget_results_cache for all using (public.has_tenant_access(tenant_id));
create policy optimization_log_rw on public.optimization_log for all using (public.has_tenant_access(tenant_id));
create policy creative_embeddings_rw on public.creative_embeddings for all using (public.has_tenant_access(tenant_id));

-- Memberships policy
create policy memberships_self_select on public.memberships
  for select using (
    user_id = auth.uid()
    or agency_id in (
      select agency_id from public.memberships
       where user_id = auth.uid()
         and role in ('agency_owner', 'agency_admin')
         and status = 'active'
    )
  );

-- ----------------------------------------------------------------------------
-- SEED WIDGETS
-- ----------------------------------------------------------------------------
insert into public.widgets_catalog (id, name, category, is_ai_powered, description) values
  ('kpi_tile',            'KPI Tile',            'metric',    false, 'Single big-number metric with delta vs comparison period'),
  ('time_series_overlay', 'Trend Overlay',       'chart',     false, 'Line/area chart with two-period overlay'),
  ('comparison_table',    'Comparison Table',    'table',     false, 'Period-vs-period rows with arrow indicators'),
  ('campaign_card',       'Campaign Deep Dive',  'layout',    true,  'Composite card: status + KPIs + narrative sections'),
  ('ai_narrative',        'AI Narrative',        'narrative', true,  'AI-generated prose block'),
  ('markdown_block',      'Markdown Block',      'layout',    false, 'Editable static markdown'),
  ('bar_chart',           'Bar Chart',           'chart',     false, 'Bar distribution'),
  ('pie_chart',           'Pie / Donut Chart',   'chart',     false, 'Part-to-whole distribution'),
  ('funnel',              'Funnel',              'chart',     false, 'Conversion funnel'),
  ('section_group',       'Section Group',       'layout',    false, 'Container for grouped widgets; supports per-entity iteration')
on conflict (id) do update set 
  name = excluded.name, 
  category = excluded.category, 
  is_ai_powered = excluded.is_ai_powered, 
  description = excluded.description;
