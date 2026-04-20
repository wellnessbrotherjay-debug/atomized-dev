-- ============================================================================
-- Agency OS Expansion: CRM & Lead Intelligence System
-- ============================================================================

-- 1. ENUMS FOR CRM
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_stage') then
    create type public.lead_stage as enum ('new', 'qualified', 'pitching', 'proposal', 'negotiation', 'won', 'lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type public.activity_type as enum ('call', 'email', 'meeting', 'note', 'stage_change', 'automation');
  end if;
end $$;

-- 2. CONTACTS (The Human Entity)
create table if not exists public.contacts (
    id          uuid primary key default gen_random_uuid(),
    tenant_id   uuid not null references public.tenants(id) on delete cascade,
    first_name  text,
    last_name   text,
    email       text,
    phone       text,
    job_title   text,
    linkedin_url text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (tenant_id, email)
);

-- 3. LEADS (The Pipeline Opportunity)
create table if not exists public.leads (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references public.tenants(id) on delete cascade,
    contact_id      uuid references public.contacts(id) on delete set null,
    company_name    text,
    stage           public.lead_stage not null default 'new',
    value           numeric(12,2) default 0,
    source          text, -- e.g., 'Google Ads', 'Direct', 'Referral'
    owner_id        uuid references auth.users(id),
    status          text default 'active',
    metadata        jsonb default '{}',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- 4. ATTRIBUTION LOG (Detailed tracking for leads)
create table if not exists public.attribution_log (
    id              uuid primary key default gen_random_uuid(),
    lead_id         uuid not null references public.leads(id) on delete cascade,
    utm_source      text,
    utm_medium      text,
    utm_campaign    text,
    utm_term        text,
    utm_content     text,
    ip_address      text,
    user_agent      text,
    device_type     text,
    browser         text,
    os              text,
    country         text,
    region          text,
    city            text,
    landing_page    text,
    referrer        text,
    first_touch_at  timestamptz not null default now(),
    last_touch_at   timestamptz not null default now()
);

-- 5. LEAD ACTIVITIES (Timeline events)
create table if not exists public.lead_activities (
    id              uuid primary key default gen_random_uuid(),
    lead_id         uuid not null references public.leads(id) on delete cascade,
    actor_id        uuid references auth.users(id),
    activity_type   public.activity_type not null,
    title           text not null,
    notes           text,
    metadata        jsonb default '{}',
    created_at      timestamptz not null default now()
);

-- 6. INDEXES FOR PERFORMANCE
create index if not exists idx_leads_tenant_id on public.leads(tenant_id);
create index if not exists idx_leads_stage on public.leads(stage);
create index if not exists idx_attribution_lead_id on public.attribution_log(lead_id);
create index if not exists idx_activities_lead_id on public.lead_activities(lead_id);

-- 7. RLS POLICIES
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.attribution_log enable row level security;
alter table public.lead_activities enable row level security;

create policy "Tenant access for contacts" on public.contacts for all using (public.has_tenant_access(tenant_id));
create policy "Tenant access for leads" on public.leads for all using (public.has_tenant_access(tenant_id));
create policy "Tenant access for activities" on public.lead_activities for all using (exists (select 1 from public.leads where id = lead_id));
create policy "Tenant access for attribution" on public.attribution_log for all using (exists (select 1 from public.leads where id = lead_id));
