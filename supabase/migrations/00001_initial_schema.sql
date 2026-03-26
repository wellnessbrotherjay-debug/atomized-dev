-- ============================================================
-- Atomized: Intelligence Reporting Platform — Initial Schema
-- ============================================================

-- Enable Row Level Security everywhere by default.
-- We add RLS policies after each table definition.

-- ------------------------------------------------------------
-- 1. Workspaces (multi-tenant container)
-- ------------------------------------------------------------
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.workspaces enable row level security;

-- ------------------------------------------------------------
-- 2. Workspace members (join table: user ↔ workspace)
-- ------------------------------------------------------------
create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');

create table public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          public.workspace_role not null default 'member',
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- ------------------------------------------------------------
-- 3. Clients (belong to a workspace)
-- ------------------------------------------------------------
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  slug          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, slug)
);

alter table public.clients enable row level security;

-- ------------------------------------------------------------
-- 4. Campaigns (belong to a client)
-- ------------------------------------------------------------
create table public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  name        text not null,
  status      text not null default 'active',
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.campaigns enable row level security;

-- ------------------------------------------------------------
-- 5. Metrics — unified three-layer data model
--    layer_type: 'media' | 'digital' | 'business'
--    Stores one value per (client, campaign, period, metric).
-- ------------------------------------------------------------
create type public.layer_type as enum ('media', 'digital', 'business');

create table public.metrics (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  campaign_id   uuid references public.campaigns(id) on delete set null,
  layer_type    public.layer_type not null,
  metric_name   text not null,
  metric_value  numeric not null,
  period_start  date not null,
  period_end    date not null,
  source        text,              -- e.g. 'google_ads', 'meta', 'ga4', 'crm'
  created_at    timestamptz not null default now()
);

alter table public.metrics enable row level security;

-- Index for fast period-over-period queries
create index idx_metrics_lookup
  on public.metrics (client_id, campaign_id, metric_name, period_start);

create index idx_metrics_layer
  on public.metrics (client_id, layer_type, period_start);

-- ------------------------------------------------------------
-- 6. Change log — budget shifts, creative changes, targeting
-- ------------------------------------------------------------
create type public.change_category as enum (
  'budget',
  'creative',
  'targeting',
  'bidding',
  'audience',
  'other'
);

create table public.change_log (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  campaign_id   uuid references public.campaigns(id) on delete set null,
  category      public.change_category not null,
  description   text not null,
  changed_at    date not null,
  changed_by    uuid references auth.users(id) on delete set null,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);

alter table public.change_log enable row level security;

create index idx_change_log_lookup
  on public.change_log (client_id, changed_at);

-- ============================================================
-- Row Level Security Policies
-- All access is scoped through workspace membership.
-- ============================================================

-- Helper: does the current user belong to a workspace?
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

-- Workspaces: users see only their own
create policy "Users see own workspaces"
  on public.workspaces for select
  using (id in (select public.user_workspace_ids()));

create policy "Users can create workspaces"
  on public.workspaces for insert
  with check (true);

create policy "Owners can update workspaces"
  on public.workspaces for update
  using (id in (
    select workspace_id from public.workspace_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- Workspace members
create policy "Members see co-members"
  on public.workspace_members for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Admins manage members"
  on public.workspace_members for all
  using (workspace_id in (
    select workspace_id from public.workspace_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- Clients
create policy "Workspace members see clients"
  on public.clients for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Admins manage clients"
  on public.clients for all
  using (workspace_id in (
    select workspace_id from public.workspace_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- Campaigns: scoped via client → workspace
create policy "Workspace members see campaigns"
  on public.campaigns for select
  using (client_id in (
    select id from public.clients
    where workspace_id in (select public.user_workspace_ids())
  ));

create policy "Admins manage campaigns"
  on public.campaigns for all
  using (client_id in (
    select id from public.clients
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  ));

-- Metrics: scoped via client → workspace
create policy "Workspace members see metrics"
  on public.metrics for select
  using (client_id in (
    select id from public.clients
    where workspace_id in (select public.user_workspace_ids())
  ));

create policy "Admins manage metrics"
  on public.metrics for all
  using (client_id in (
    select id from public.clients
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  ));

-- Change log: scoped via client → workspace
create policy "Workspace members see change log"
  on public.change_log for select
  using (client_id in (
    select id from public.clients
    where workspace_id in (select public.user_workspace_ids())
  ));

create policy "Admins manage change log"
  on public.change_log for all
  using (client_id in (
    select id from public.clients
    where workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  ));

-- ============================================================
-- Trigger: auto-add creator as workspace owner
-- ============================================================
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

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();
