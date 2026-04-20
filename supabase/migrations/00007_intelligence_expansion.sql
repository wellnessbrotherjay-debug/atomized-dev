-- ============================================================================
-- Intelligence Expansion — Media Plans, Budgeting, and Insight Flags
-- Migration: 20260420000007_intelligence_expansion.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Media Plans
-- ----------------------------------------------------------------------------
create table if not exists public.media_plans (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  name             text not null,
  status           text not null default 'draft', -- draft, active, completed, archived
  start_date       date not null,
  end_date         date not null,
  total_budget     numeric(12,2) not null default 0,
  currency         text not null default 'USD',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_media_plans_tenant on public.media_plans(tenant_id);

-- ----------------------------------------------------------------------------
-- 2. Media Plan Lines (Specific channel/objective targets)
-- ----------------------------------------------------------------------------
create table if not exists public.media_plan_lines (
  id               uuid primary key default gen_random_uuid(),
  media_plan_id    uuid not null references public.media_plans(id) on delete cascade,
  channel          text not null, -- Facebook, Google, LinkedIn, etc.
  objective        text not null, -- Awareness, Conversion, Traffic, etc.
  target_spend     numeric(12,2) not null default 0,
  target_kpi_type  text, -- CPA, CPL, ROAS
  target_kpi_value numeric(12,4),
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);
create index if not exists idx_media_plan_lines_plan on public.media_plan_lines(media_plan_id);

-- ----------------------------------------------------------------------------
-- 3. Insight Flags (Automated Logic Results)
-- ----------------------------------------------------------------------------
create table if not exists public.insight_flags (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  entity_type      text not null, -- campaign, adset, ad
  external_id      text not null,
  flag_type        text not null, -- anomaly_surge, efficiency_drop, fatigue_warning
  severity         text not null default 'info', -- info, warning, critical
  description      text not null,
  is_resolved      boolean not null default false,
  metadata         jsonb not null default '{}',
  detected_at      timestamptz not null default now(),
  resolved_at      timestamptz
);
create index if not exists idx_insight_flags_tenant on public.insight_flags(tenant_id, is_resolved);

-- ----------------------------------------------------------------------------
-- RLS POLICIES
-- ----------------------------------------------------------------------------
alter table public.media_plans       enable row level security;
alter table public.media_plan_lines  enable row level security;
alter table public.insight_flags     enable row level security;

-- RW policies using established has_tenant_access helper
create policy media_plans_rw on public.media_plans for all using (public.has_tenant_access(tenant_id));
create policy media_plan_lines_rw on public.media_plan_lines for all 
  using (exists (select 1 from public.media_plans where id = media_plan_lines.media_plan_id and public.has_tenant_access(tenant_id)));
create policy insight_flags_rw on public.insight_flags for all using (public.has_tenant_access(tenant_id));

-- Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_media_plans_updated_at
  before update on public.media_plans
  for each row execute function public.handle_updated_at();
