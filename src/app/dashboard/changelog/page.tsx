"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";
import type { ChangeCategory } from "@/types/database";

interface Client {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  client_id: string;
}

interface ChangeEntry {
  id: string;
  category: ChangeCategory;
  description: string;
  changed_at: string;
  created_at: string;
  campaign_id: string | null;
}

const CATEGORIES: { value: ChangeCategory; label: string }[] = [
  { value: "budget", label: "Budget Shift" },
  { value: "creative", label: "Creative Change" },
  { value: "targeting", label: "Targeting Change" },
  { value: "bidding", label: "Bidding Change" },
  { value: "audience", label: "Audience Change" },
  { value: "other", label: "Other" },
];

export default function ChangeLogPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [loadingChanges, setLoadingChanges] = useState(false);

  // Form
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCategory, setFormCategory] = useState<ChangeCategory>("budget");
  const [formDescription, setFormDescription] = useState("");
  const [formCampaign, setFormCampaign] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  // Load change log entries
  const loadChanges = useCallback(async () => {
    if (!selectedClient) {
      setChanges([]);
      return;
    }
    setLoadingChanges(true);
    const supabase = createClient();

    let query = supabase
      .from("change_log")
      .select("id, category, description, changed_at, created_at, campaign_id")
      .eq("client_id", selectedClient)
      .order("changed_at", { ascending: false })
      .limit(100);

    if (selectedCampaign) {
      query = query.eq("campaign_id", selectedCampaign);
    }

    const { data } = await query;
    setChanges((data ?? []) as ChangeEntry[]);
    setLoadingChanges(false);
  }, [selectedClient, selectedCampaign]);

  useEffect(() => {
    loadChanges();
  }, [loadChanges]);

  if (wsLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }
  if (!workspace) return <WorkspacePicker />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) {
      setSaveError("Please select a client.");
      return;
    }
    setSaveError(null);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("change_log").insert({
      client_id: selectedClient,
      campaign_id: formCampaign || null,
      category: formCategory,
      description: formDescription,
      changed_at: formDate,
    });

    if (error) {
      setSaveError(error.message);
    } else {
      setFormDescription("");
      loadChanges();
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

      {/* Client/Campaign selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
          <label className="block text-sm font-medium text-gray-400 mb-1">Campaign (optional)</label>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            disabled={!selectedClient}
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
      {selectedClient && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-800 bg-gray-900/30 p-6 mb-8 space-y-4"
        >
          <h3 className="font-semibold text-white mb-2">Log a Change</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Date of Change</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Change Type</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ChangeCategory)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Campaign</label>
              <select
                value={formCampaign}
                onChange={(e) => setFormCampaign(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">General (no campaign)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe what changed..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
          {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Log Change"}
          </button>
        </form>
      )}

      {/* Change list */}
      {selectedClient && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Change History</h2>
          {loadingChanges ? (
            <p className="text-gray-500">Loading...</p>
          ) : changes.length === 0 ? (
            <div className="rounded-lg border border-gray-800 p-6 text-center text-gray-500">
              No changes logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className="flex items-start gap-4 rounded-lg border border-gray-800 p-4"
                >
                  <div className="shrink-0 mt-0.5">
                    <CategoryBadge category={change.category} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{change.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(change.changed_at).toLocaleDateString()}
                      {getCampaignName(change.campaign_id) && (
                        <> &middot; {getCampaignName(change.campaign_id)}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
