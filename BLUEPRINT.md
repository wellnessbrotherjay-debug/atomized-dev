# Atomized: Decision-Intelligence Platform Blueprint

Atomized is not just a dashboard tool; it is a custom marketing reporting and decision-intelligence platform. This document outlines the core architecture, data models, and implementation roadmap.

## Core Value Proposition
The platform bridges the gap between raw performance data and human strategic intent. It moves beyond "what happened" to "why it happened" and "what to do next."

## Core Flow
**Data Ingestion (Ads APIs) → BigQuery Warehouse → Transformation Layer → Context Layer (Human Logic) → Automated Reporting (PPT/Slides)**

---

## Architectural Modules

### 1. Data Layer (BigQuery + Supabase)
- **BigQuery**: High-volume ads performance data and platform `change_events`.
- **Supabase**: Operational data, human strategic context, planning, approvals, and reporting history.

### 2. Context Layer (Intelligence)
The missing piece in standard dashboards. Stores the **human intent** behind actions:
- Planning notes: "Why are we shifting budget?"
- Strategic pivots: "Client approved new creative direction."
- Anomaly flags: "CPL spiked because lead quality focus increased."

### 3. Reporting Engine
- **Automated PPT Generation**: Using PptxGenJS or Google Slides API.
- **Rules Engine**: Automated anomaly detection and LLM-powered insight generation.

---

## Technical Roadmap

### Phase 1: Context & Reporting OS (Current Focus)
- [ ] **Unified Schema Expansion**: Implement `media_plans`, `change_context_log`, `insight_flags`, and `report_runs`.
- [ ] **Context Capture UI**: Build the internal form for strategist log entries.
- [ ] **Deck Automation Engine**: Implement the PPT generator service.
- [ ] **Platform Account Mapping**: Map external Google/Meta IDs to internal clients.

### Phase 2: Ingestion & Modeling
- [ ] **Ingestion Jobs**: Setup BigQuery scheduled queries for Ads APIs.
- [ ] **Transformation Layer**: canonical schema normalization.

### Phase 3: Project Management & Finance
- [ ] **PM Layer**: `project_tasks` linked to strategic changes.
- [ ] **Invoicing Hooks**: Tracking delivery status and media plan vs actual.

---

## Database Schema (Supabase)

### Planning & Context
- `change_context_log`: Strategic reasons for campaign edits.
- `media_plans` & `media_plan_lines`: Budget targets and KPI goals.

### Operations
- `platform_accounts`: Mapping external IDs to clients.
- `insight_flags`: Automated detection of performance shifts.

### Deliverables
- `report_runs`: History of generated PPT decks and client snapshots.
- `project_tasks` & `invoices`: Operational fulfillment.
