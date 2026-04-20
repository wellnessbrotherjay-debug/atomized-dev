"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";
import { QuickLogModal } from "@/components/quick-log-modal";
import type { ChangeCategory } from "@/types/database";

interface Tenant {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  tenant_id: string;
}

interface ChangeEvent {
  id: string;
  source_platform: string;
  change_type: string;
  changed_fields: any;
  platform_event_timestamp: string;
  detected_at: string;
}

interface DecisionContext {
  id: string;
  context_type: string;
  decision_title: string;
  decision_reason: string;
  expected_outcome: string | null;
  status: string;
  created_at: string;
  campaign_id: string | null;
  requested_by: string | null;
  metadata: any;
}

const CONTEXT_TYPES = [
  { value: "client_request", label: "Client Request" },
  { value: "budget_control", label: "Budget Control" },
  { value: "underperformance", label: "Underperformance" },
  { value: "overperformance_scale", label: "Overperformance Scale" },
  { value: "creative_fatigue", label: "Creative Fatigue" },
  { value: "audience_refinement", label: "Audience Refinement" },
  { value: "landing_page_issue", label: "Landing Page Issue" },
  { value: "tracking_issue", label: "Tracking Issue" },
  { value: "sales_feedback", label: "Sales Feedback" },
  { value: "compliance_legal", label: "Compliance & Legal" },
  { value: "inventory_issue", label: "Inventory Issue" },
  { value: "seasonal_shift", label: "Seasonal Shift" },
  { value: "competitor_response", label: "Competitor Response" },
  { value: "platform_learning", label: "Platform Learning" },
  { value: "test_hypothesis", label: "Test Hypothesis" },
  { value: "reporting_correction", label: "Reporting Correction" },
  { value: "technical_error", label: "Technical Error" },
  { value: "approval_delay", label: "Approval Delay" },
];

const REQUESTED_BY_TYPES = [
  { value: "client", label: "Client" },
  { value: "account_manager", label: "Account Manager" },
  { value: "paid_media_buyer", label: "Paid Media Buyer" },
  { value: "analyst", label: "Analyst" },
  { value: "creative", label: "Creative" },
  { value: "finance", label: "Finance" },
  { value: "ops", label: "Operations" },
];

export default function ChangeLogPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [decisions, setDecisions] = useState<DecisionContext[]>([]);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [formType, setFormType] = useState("optimization");
  const [formTitle, setFormTitle] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formOutcome, setFormOutcome] = useState("");
  const [formCampaign, setFormCampaign] = useState("");
  const [formRequestedBy, setFormRequestedBy] = useState("");
  const [formRequestedByType, setFormRequestedByType] = useState("account_manager");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [modalInitialTitle, setModalInitialTitle] = useState("");

  const openQuickLog = (event: ChangeEvent) => {
    setSelectedEventId(event.id);
    setModalInitialTitle(`Context for ${event.change_type.replace(/_/g, " ")}`);
    setIsModalOpen(true);
  };

  // Load tenants
  useEffect(() => {
    if (wsLoading || !workspace) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");
      setTenants((data ?? []) as Tenant[]);
    }
    load();
  }, [workspace, wsLoading]);

  // Load campaigns when tenant changes
  useEffect(() => {
    if (!selectedTenant) {
      setCampaigns([]);
      return;
    }
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("campaigns")
        .select("id, name, tenant_id")
        .eq("tenant_id", selectedTenant)
        .order("name");
      setCampaigns((data ?? []) as Campaign[]);
    }
    load();
  }, [selectedTenant]);

  // Load decision context and change events
  const loadData = useCallback(async () => {
    if (!selectedTenant) {
      setDecisions([]);
      setEvents([]);
      return;
    }
    setLoading(true);
    const supabase = createClient();

    // Fetch human decisions
    let decQuery = supabase
      .from("optimization_log")
      .select("*")
      .eq("tenant_id", selectedTenant)
      .order("created_at", { ascending: false })
      .limit(50);

    if (selectedCampaign) {
      decQuery = decQuery.eq("campaign_id", selectedCampaign);
    }

    // Fetch machine events
    let eventQuery = supabase
      .from("change_event_registry")
      .select("*")
      .eq("tenant_id", selectedTenant)
      .order("platform_event_timestamp", { ascending: false })
      .limit(50);

    if (selectedCampaign) {
      eventQuery = eventQuery.eq("external_campaign_id", selectedCampaign); 
    }

    const [{ data: decData }, { data: evtData }] = await Promise.all([
      decQuery,
      eventQuery
    ]);

    setDecisions((decData ?? []) as DecisionContext[]);
    setEvents((evtData ?? []) as ChangeEvent[]);
    setLoading(false);
  }, [selectedTenant, selectedCampaign]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (wsLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }
  if (!workspace) return <WorkspacePicker />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant) {
      setSaveError("Please select a tenant.");
      return;
    }
    setSaveError(null);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("optimization_log").insert({
      tenant_id: selectedTenant,
      campaign_id: formCampaign || null,
      change_type: formType,
      description: formReason,
      effective_date: new Date().toISOString().split('T')[0],
      metadata: {
        title: formTitle,
        expected_outcome: formOutcome || null,
        requested_by: formRequestedBy || null,
        requested_by_type: formRequestedByType
      }
    });

    if (error) {
      setSaveError(error.message);
    } else {
      setFormTitle("");
      setFormReason("");
      setFormOutcome("");
      loadData();
    }
    setSaving(false);
  }

  function getCampaignName(campaignId: string | null) {
    if (!campaignId) return null;
    return campaigns.find((c) => c.id === campaignId)?.name ?? null;
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Change Log</h1>
        <p className="text-gray-400 mt-1">Track budget shifts, creative changes, and targeting updates</p>
      </div>

      {/* Tenant/Campaign selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Tenant</label>
          <select
            value={selectedTenant}
            onChange={(e) => {
              setSelectedTenant(e.target.value);
              setSelectedCampaign("");
            }}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select tenant...</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Campaign (optional)</label>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            disabled={!selectedTenant}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log entry form */}
      {selectedTenant && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 mb-10 space-y-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Log Decision Context</h3>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Human Reason Layer</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Decision Title</label>
              <input
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Budget shift for Week 3"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Context Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
              >
                {CONTEXT_TYPES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Campaign</label>
              <select
                value={formCampaign}
                onChange={(e) => setFormCampaign(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="">General (no campaign)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Strategic Reason (The "Why")</label>
              <textarea
                required
                rows={3}
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Describe the business reason or hypothesis..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Expected Outcome</label>
              <textarea
                rows={3}
                value={formOutcome}
                onChange={(e) => setFormOutcome(e.target.value)}
                placeholder="What KPI improvement are you targeting?"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Requested By</label>
              <input
                value={formRequestedBy}
                onChange={(e) => setFormRequestedBy(e.target.value)}
                placeholder="Name or Client Contact"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Requestor Role</label>
              <select
                value={formRequestedByType}
                onChange={(e) => setFormRequestedByType(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none transition-colors"
              >
                {REQUESTED_BY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Commit Decision Context"}
              </button>
            </div>
          </div>
          {saveError && <p className="text-sm text-red-400 mt-2">{saveError}</p>}
        </form>
      )}

      {/* Split view for history/events */}
      {selectedTenant && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Strategic Decisions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Strategic Decisions</h2>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">Human Logged</span>
            </div>
            
            {loading ? (
              <p className="text-gray-500 animate-pulse">Loading decisions...</p>
            ) : decisions.length === 0 ? (
              <div className="rounded-xl border border-gray-800 border-dashed p-10 text-center text-gray-500">
                No decisions logged yet.
              </div>
            ) : (
              <div className="space-y-4">
                {decisions.map((dec) => (
                  <div
                    key={dec.id}
                    className="group rounded-xl border border-gray-800 bg-gray-900/20 p-5 hover:bg-gray-900/40 transition-all border-l-4 border-l-indigo-500"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                        {dec.context_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(dec.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-md font-bold text-white mb-2">{dec.decision_title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{dec.decision_reason}</p>
                    {dec.expected_outcome && (
                      <div className="text-xs bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                        <span className="text-gray-500 font-semibold mr-2 italic">Intent:</span>
                        <span className="text-gray-300">{dec.expected_outcome}</span>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500">
                      <span>BY: {dec.metadata?.requested_by || "Unknown"}</span>
                      <span>{getCampaignName(dec.campaign_id) || "Global"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Machine Detected Events */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Detected Events</h2>
              <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">API Change History</span>
            </div>

            {loading ? (
              <p className="text-gray-500 animate-pulse">Syncing platform events...</p>
            ) : events.length === 0 ? (
              <div className="rounded-xl border border-gray-800 border-dashed p-10 text-center text-gray-500">
                No platform activity detected.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-4 rounded-xl border border-gray-800 bg-gray-900/10 p-4 hover:bg-gray-900/30 transition-all"
                  >
                    <div className="shrink-0 mt-1">
                      <div className={`w-2 h-10 rounded-full ${evt.source_platform === 'meta' ? 'bg-blue-600' : 'bg-red-600'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-400">{evt.source_platform.toUpperCase()}</span>
                        <span className="text-[10px] text-gray-600">{new Date(evt.platform_event_timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-white font-medium">{evt.change_type.replace(/_/g, " ")}</p>
                      <pre className="text-[10px] text-gray-500 mt-2 bg-black/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(evt.changed_fields, null, 2)}
                      </pre>
                      <button 
                        onClick={() => openQuickLog(evt)}
                        className="mt-3 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
                      >
                        Add Context Reason
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reusable Modal */}
      <QuickLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadData()}
        tenant_id={selectedTenant}
        campaignId={selectedCampaign}
        relatedEventId={selectedEventId}
        initialTitle={modalInitialTitle}
      />
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    budget: "bg-blue-500/20 text-blue-400",
    creative: "bg-purple-500/20 text-purple-400",
    targeting: "bg-orange-500/20 text-orange-400",
    bidding: "bg-cyan-500/20 text-cyan-400",
    audience: "bg-pink-500/20 text-pink-400",
    other: "bg-gray-500/20 text-gray-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[category] ?? colors.other
      }`}
    >
      {category}
    </span>
  );
}
