"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";
import type { LayerType } from "@/types/database";

interface Client {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  client_id: string;
}

interface MetricRow {
  id: string;
  layer_type: LayerType;
  metric_name: string;
  metric_value: number;
  period_start: string;
  period_end: string;
  source: string | null;
  created_at: string;
}

const MEDIA_METRICS = [
  { key: "ad_spend", label: "Ad Spend ($)" },
  { key: "impressions", label: "Impressions" },
  { key: "clicks", label: "Clicks" },
  { key: "ctr", label: "CTR (%)" },
  { key: "cpc", label: "CPC ($)" },
  { key: "cpm", label: "CPM ($)" },
  { key: "reach", label: "Reach" },
];

const DIGITAL_METRICS = [
  { key: "sessions", label: "Sessions" },
  { key: "page_views", label: "Page Views" },
  { key: "form_submissions", label: "Form Submissions" },
  { key: "phone_calls", label: "Phone Calls" },
  { key: "sign_ups", label: "Sign-ups" },
  { key: "bounce_rate", label: "Bounce Rate (%)" },
];

const BUSINESS_METRICS = [
  { key: "qualified_leads", label: "Qualified Leads" },
  { key: "sqls", label: "SQLs" },
  { key: "closed_deals", label: "Closed Deals" },
  { key: "revenue", label: "Revenue ($)" },
  { key: "pipeline_value", label: "Pipeline Value ($)" },
  { key: "roas", label: "ROAS" },
];

type TabKey = "media" | "digital" | "business";

const TABS: { key: TabKey; label: string; metrics: { key: string; label: string }[] }[] = [
  { key: "media", label: "Media Metrics", metrics: MEDIA_METRICS },
  { key: "digital", label: "Digital Outcomes", metrics: DIGITAL_METRICS },
  { key: "business", label: "Business Outcomes", metrics: BUSINESS_METRICS },
];

export default function DataInputPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("media");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [existingMetrics, setExistingMetrics] = useState<MetricRow[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Load clients
  useEffect(() => {
    if (wsLoading || !workspace) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("workspace_id", workspace!.id)
        .order("name");
      setClients((data ?? []) as Client[]);
    }
    load();
  }, [workspace, wsLoading]);

  // Load campaigns when client changes
  useEffect(() => {
    if (!selectedClient) {
      setCampaigns([]);
      setSelectedCampaign("");
      return;
    }
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("campaigns")
        .select("id, name, client_id")
        .eq("client_id", selectedClient)
        .order("name");
      setCampaigns((data ?? []) as Campaign[]);
    }
    load();
  }, [selectedClient]);

  // Load existing metrics for selected client
  const loadExistingMetrics = useCallback(async () => {
    if (!selectedClient) {
      setExistingMetrics([]);
      return;
    }
    setLoadingMetrics(true);
    const supabase = createClient();
    let query = supabase
      .from("metrics")
      .select("id, layer_type, metric_name, metric_value, period_start, period_end, source, created_at")
      .eq("client_id", selectedClient)
      .order("period_start", { ascending: false })
      .limit(50);

    if (selectedCampaign) {
      query = query.eq("campaign_id", selectedCampaign);
    }

    const { data } = await query;
    setExistingMetrics((data ?? []) as MetricRow[]);
    setLoadingMetrics(false);
  }, [selectedClient, selectedCampaign]);

  useEffect(() => {
    loadExistingMetrics();
  }, [loadExistingMetrics]);

  if (wsLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }
  if (!workspace) return <WorkspacePicker />;

  function setMetricValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!selectedClient || !periodStart || !periodEnd) {
      setSaveMessage("Please select a client and set the period dates.");
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const supabase = createClient();
    const rows: {
      client_id: string;
      campaign_id: string | null;
      layer_type: LayerType;
      metric_name: string;
      metric_value: number;
      period_start: string;
      period_end: string;
    }[] = [];

    for (const tab of TABS) {
      for (const metric of tab.metrics) {
        const val = values[metric.key];
        if (val && val !== "" && !isNaN(Number(val))) {
          rows.push({
            client_id: selectedClient,
            campaign_id: selectedCampaign || null,
            layer_type: tab.key as LayerType,
            metric_name: metric.key,
            metric_value: Number(val),
            period_start: periodStart,
            period_end: periodEnd,
          });
        }
      }
    }

    if (rows.length === 0) {
      setSaveMessage("No values to save. Enter at least one metric.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("metrics").insert(rows);

    if (error) {
      setSaveMessage(`Error: ${error.message}`);
    } else {
      setSaveMessage(`Saved ${rows.length} metric(s) successfully.`);
      setValues({});
      loadExistingMetrics();
    }
    setSaving(false);
  }

  const filteredCampaigns = campaigns.filter(
    (c) => c.client_id === selectedClient
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Data Input</h1>
        <p className="text-gray-400 mt-1">Enter performance metrics for your campaigns</p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Client</label>
          <select
            value={selectedClient}
            onChange={(e) => {
              setSelectedClient(e.target.value);
              setSelectedCampaign("");
            }}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Campaign</label>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            disabled={!selectedClient}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">All campaigns</option>
            {filteredCampaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Period Start</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Period End</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {TABS.find((t) => t.key === activeTab)?.metrics.map((metric) => (
          <div key={metric.key}>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              {metric.label}
            </label>
            <input
              type="number"
              step="any"
              value={values[metric.key] ?? ""}
              onChange={(e) => setMetricValue(metric.key, e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Metrics"}
        </button>
        {saveMessage && (
          <p
            className={`text-sm ${
              saveMessage.startsWith("Error") ? "text-red-400" : "text-green-400"
            }`}
          >
            {saveMessage}
          </p>
        )}
      </div>

      {/* Existing data table */}
      {selectedClient && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Previously Entered Data</h2>
          {loadingMetrics ? (
            <p className="text-gray-500">Loading...</p>
          ) : existingMetrics.length === 0 ? (
            <div className="rounded-lg border border-gray-800 p-6 text-center text-gray-500">
              No data entered yet for this client.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-400">Layer</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400">Metric</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-400">Value</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400">Period</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400">Date Entered</th>
                  </tr>
                </thead>
                <tbody>
                  {existingMetrics.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-gray-800/50 hover:bg-gray-900/30"
                    >
                      <td className="px-4 py-3">
                        <LayerBadge type={m.layer_type} />
                      </td>
                      <td className="px-4 py-3 text-white">
                        {m.metric_name.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        {Number(m.metric_value).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {m.period_start} to {m.period_end}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LayerBadge({ type }: { type: LayerType }) {
  const colors: Record<string, string> = {
    media: "bg-blue-500/20 text-blue-400",
    digital: "bg-purple-500/20 text-purple-400",
    business: "bg-emerald-500/20 text-emerald-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[type] ?? "bg-gray-500/20 text-gray-400"
      }`}
    >
      {type}
    </span>
  );
}
