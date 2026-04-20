-- ============================================================
-- Atomized: Phase 1B — Enhanced Decision Context Layer
-- ============================================================

-- 1. Change Event Registry (Machine-detected events)
create table public.change_event_registry (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clients(id) on delete cascade, -- Using client_id as tenant_id in this schema
  source_platform text not null,
  external_account_id text,
  external_campaign_id text,
  external_entity_type text not null,
  external_entity_id text not null,
  change_type text not null,
  changed_fields jsonb not null,
  old_values jsonb,
  new_values jsonb,
  platform_actor text,
  platform_event_timestamp timestamptz not null,
  detected_at timestamptz default now(),
  correlation_key text,
  raw_payload jsonb
);

alter table public.change_event_registry enable row level security;

-- 2. Decision Context Log (The Human "Why")
create table public.decision_context_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  source_platform text,
  related_change_event_id uuid references public.change_event_registry(id) on delete set null,
  context_type text not null, 
  -- client_request, optimization, compliance, creative_refresh, budget_shift, tracking_issue, test, pause_reason, escalation

  decision_title text not null,
  decision_reason text not null,
  expected_outcome text,
  expected_kpis jsonb default '{}'::jsonb,
  urgency text default 'normal',
  requested_by text,
  requested_by_type text, 
  -- client, account_manager, paid_media_buyer, analyst, creative, finance, ops

  approved_by text,
  implementation_owner text,
  implementation_due_at timestamptz,
  effective_from timestamptz,
  effective_to timestamptz,
  status text default 'logged',
  tags text[],
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.decision_context_log enable row level security;

-- 3. Decision Impact Reviews (Post-change outcome)
create table public.decision_impact_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clients(id) on delete cascade,
  decision_context_id uuid not null references public.decision_context_log(id) on delete cascade,
  review_window_start date not null,
  review_window_end date not null,
  measured_metrics jsonb not null,
  outcome_status text not null, 
  -- positive, negative, neutral, mixed, inconclusive

  outcome_summary text,
  follow_up_action text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz default now()
);

alter table public.decision_impact_reviews enable row level security;

-- 4. Campaign Annotations (Chart-level notes)
create table public.campaign_annotations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  source_platform text,
  annotation_date timestamptz not null,
  annotation_type text not null,
  title text not null,
  body text not null,
  severity text default 'info',
  linked_decision_context_id uuid references public.decision_context_log(id) on delete set null,
  visible_in_reports boolean default true,
  created_at timestamptz default now()
);

alter table public.campaign_annotations enable row level security;

-- 5. Messaging Versions (Prompt & Copy versioning)
create table public.messaging_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  platform text,
  entity_type text, -- campaign, adset, ad, creative, lp
  entity_external_id text,
  version_number int not null,
  message_title text,
  primary_angle text,
  primary_cta text,
  prompt_text text,
  copy_text text,
  hooks jsonb,
  offer_summary text,
  audience_hypothesis text,
  status text default 'draft',
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.messaging_versions enable row level security;

-- ============================================================
-- RLS Policies (Standard workspace-based scoping)
-- ============================================================

-- Helper assumes public.user_workspace_ids() already exists from initial migration.

-- Change Event Registry
create policy "Workspace members see change_events" on public.change_event_registry for select
  using (tenant_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage change_events" on public.change_event_registry for all
  using (tenant_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Decision Context Log
create policy "Workspace members see decision_context" on public.decision_context_log for select
  using (tenant_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage decision_context" on public.decision_context_log for all
  using (tenant_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Decision Impact Reviews
create policy "Workspace members see impact_reviews" on public.decision_impact_reviews for select
  using (tenant_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage impact_reviews" on public.decision_impact_reviews for all
  using (tenant_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Campaign Annotations
create policy "Workspace members see annotations" on public.campaign_annotations for select
  using (tenant_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage annotations" on public.campaign_annotations for all
  using (tenant_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));

-- Messaging Versions
create policy "Workspace members see messaging_versions" on public.messaging_versions for select
  using (tenant_id in (select id from public.clients where workspace_id in (select public.user_workspace_ids())));
create policy "Admins manage messaging_versions" on public.messaging_versions for all
  using (tenant_id in (select id from public.clients where workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner', 'admin'))));
