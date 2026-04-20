-- ============================================================
-- Atomized: Phase 1 — Vision Refinement & Context Layer
-- ============================================================

-- 1. Platform Accounts (Mapping external IDs to clients)
create table public.platform_accounts (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients(id) on delete cascade,
  platform            text not null, -- 'google_ads', 'meta', etc.
  external_account_id  text not null,
  account_name        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (client_id, platform, external_account_id)
);

alter table public.platform_accounts enable row level security;

-- 2. Media Plans (High-level budget and KPI planning)
create table public.media_plans (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  name          text not null,
  period_start  date not null,
  period_end    date not null,
  total_budget  numeric not null default 0,
  target_cpa    numeric,
  target_roas   numeric,
  status        text not null default 'draft', -- 'draft', 'active', 'completed'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.media_plans enable row level security;

create table public.media_plan_lines (
  id              uuid primary key default gen_random_uuid(),
  media_plan_id   uuid not null references public.media_plans(id) on delete cascade,
  platform        text not null,
  allocated_budget numeric not null default 0,
  objective       text,
  target_metric   text,
  target_value    numeric,
  created_at      timestamptz not null default now()
);

alter table public.media_plan_lines enable row level security;

-- 3. Strategic Context Log (The "Why" behind changes)
create table public.change_context_log (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.clients(id) on delete cascade,
  campaign_id           uuid references public.campaigns(id) on delete set null,
  change_timestamp      timestamptz not null default now(),
  change_type           text not null, -- 'budget_shift', 'creative_swap', 'targeting_update', etc.
  human_reason          text not null,
  expected_outcome      text,
  owner                 text,
  approved_by           text,
  metadata              jsonb default '{}',
  created_at            timestamptz not null default now()
);

alter table public.change_context_log enable row level security;

-- 4. Insight Flags (Automated anomaly detection results)
create table public.insight_flags (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  severity          text not null default 'info', -- 'info', 'warning', 'critical'
  flag_type         text not null, -- 'spend_spike', 'performance_drop', etc.
  platform          text,
  campaign_id       uuid references public.campaigns(id) on delete set null,
  detected_at       timestamptz not null default now(),
  metric_snapshot   jsonb default '{}',
  explanation       text,
  status            text not null default 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at        timestamptz not null default now()
);

alter table public.insight_flags enable row level security;

-- 5. Report Runs (Historical record of generated PPTs)
create table public.report_runs (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  period_start    date not null,
  period_end      date not null,
  template_version text,
  ppt_url         text,
  generated_at    timestamptz not null default now(),
  metadata        jsonb default '{}'
);

alter table public.report_runs enable row level security;

-- 6. Operations: Project Tasks & Invoices
create table public.project_tasks (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  title         text not null,
  status        text not null default 'backlog', -- 'backlog', 'todo', 'in_progress', 'done'
  owner         text,
  due_date      date,
  linked_context_id uuid references public.change_context_log(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.project_tasks enable row level security;

create table public.invoices (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  amount        numeric not null default 0,
  currency      text not null default 'USD',
  status        text not null default 'draft', -- 'draft', 'sent', 'paid', 'overdue'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.invoices enable row level security;

-- ============================================================
-- RLS Policies Migration (Access via client -> workspace)
-- ============================================================

-- Platform Accounts
create policy "Workspace members see platform_accounts" on public.platform_accounts for select
  using (client_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage platform_accounts" on public.platform_accounts for all
  using (client_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Media Plans
create policy "Workspace members see media_plans" on public.media_plans for select
  using (client_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage media_plans" on public.media_plans for all
  using (client_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Media Plan Lines
create policy "Workspace members see media_plan_lines" on public.media_plan_lines for select
  using (media_plan_id in (select id from public.media_plans where client_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids()))));
create policy "Admins manage media_plan_lines" on public.media_plan_lines for all
  using (media_plan_id in (select id from public.media_plans where client_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin')))));

-- Change Context
create policy "Workspace members see change_context" on public.change_context_log for select
  using (client_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage change_context" on public.change_context_log for all
  using (client_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Insight Flags
create policy "Workspace members see insight_flags" on public.insight_flags for select
  using (client_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage insight_flags" on public.insight_flags for all
  using (client_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Report Runs
create policy "Workspace members see report_runs" on public.report_runs for select
  using (client_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage report_runs" on public.report_runs for all
  using (client_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Project Tasks
create policy "Workspace members see project_tasks" on public.project_tasks for select
  using (client_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage project_tasks" on public.project_tasks for all
  using (client_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Invoices
create policy "Workspace members see invoices" on public.invoices for select
  using (client_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage invoices" on public.invoices for all
  using (client_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));
