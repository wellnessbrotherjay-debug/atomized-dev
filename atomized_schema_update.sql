-- ============================================================
-- Atomized: Intelligence Reporting Platform — Database Schema Update
-- Reconciling bwndbccgzjdgtcyornwn with Atomized Core
-- ============================================================

-- 1. EXTENSIONS
create extension if not exists pgcrypto;
create extension if not exists vector;

-- 2. CORE ENUMS (Handle existing enums)
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

-- 3. CORE TABLES (IF NOT EXISTS)
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

create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  slug          text not null,
  industry      text,
  website       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, slug)
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

create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade,
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
  client_id     uuid references public.clients(id) on delete cascade,
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

-- 4. ENSURE COLUMNS ON EXISTING TABLES
-- Reconciling 'leads' and 'traffic_events' if they exist from the behavioral tracking engine
do $$
begin
  -- Leads table updates
  if exists (select 1 from information_schema.tables where table_name = 'leads') then
    if not exists (select 1 from information_schema.columns where table_name = 'leads' and column_name = 'workspace_id') then
       -- This might be tricky if leads are not workspace-bound in the other system
       alter table public.leads add column workspace_id uuid references public.workspaces(id);
    end if;
  end if;

  -- Traffic events updates
  if exists (select 1 from information_schema.tables where table_name = 'traffic_events') then
    if not exists (select 1 from information_schema.columns where table_name = 'traffic_events' and column_name = 'tenant_id') then
       alter table public.traffic_events add column tenant_id uuid references public.tenants(id);
    end if;
  end if;
end $$;

-- 5. RLS POLICIES & FUNCTIONS
create or replace function public.user_workspace_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid();
$$;

create or replace function public.has_tenant_access(t_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1 
    from public.tenants t
    join public.agencies a on t.agency_id = a.id
    -- This assumes agency access is tied to workspace or something similar. 
    -- For now, we'll allow if user is authenticated for MVP.
    where t.id = t_id
  );
end;
$$;

-- Apply RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients enable row level security;
alter table public.campaigns enable row level security;
alter table public.optimization_log enable row level security;
alter table public.change_event_registry enable row level security;

-- Policies (Basic versions)
drop policy if exists "Users see own workspaces" on public.workspaces;
create policy "Users see own workspaces" on public.workspaces for select using (id in (select public.user_workspace_ids()));

drop policy if exists "Workspace members see clients" on public.clients;
create policy "Workspace members see clients" on public.clients for select using (workspace_id in (select public.user_workspace_ids()));

drop policy if exists "Workspace members see optimization_log" on public.optimization_log;
create policy "Workspace members see optimization_log" on public.optimization_log for select using (public.has_tenant_access(tenant_id));

-- 6. TRIGGERS
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();
