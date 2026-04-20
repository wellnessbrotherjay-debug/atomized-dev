"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  website: string | null;
}

interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  platform: string | null;
  status: string;
  start_date: string | null;
}

export default function TenantsPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);

  // Add tenant form
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState({ name: "", industry: "", website: "" });
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);

  // Add campaign form
  const [showAddCampaign, setShowAddCampaign] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    platform: "",
    status: "active",
    start_date: "",
  });
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    const supabase = createClient();

    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id, name, slug, industry, website")
      .order("name");

    const tenantList = (tenantData ?? []) as Tenant[];
    setTenants(tenantList);

    if (tenantList.length > 0) {
      const tenantIds = tenantList.map((t) => t.id);
      const { data: campData } = await supabase
        .from("campaigns")
        .select("id, tenant_id, name, platform, status, start_date")
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false });
      setCampaigns((campData ?? []) as Campaign[]);
    } else {
      setCampaigns([]);
    }

    setLoading(false);
  }, [workspace]);

  useEffect(() => {
    if (!wsLoading && workspace) loadData();
    else if (!wsLoading) setLoading(false);
  }, [workspace, wsLoading, loadData]);

  if (wsLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }
  if (!workspace) return <WorkspacePicker />;

  function toSlug(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleAddTenant(e: React.FormEvent) {
    e.preventDefault();
    setTenantError(null);
    setTenantSaving(true);

    const slug = toSlug(tenantForm.name);
    if (!slug) {
      setTenantError("Invalid tenant name.");
      setTenantSaving(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("tenants").insert({
      name: tenantForm.name,
      slug,
      industry: tenantForm.industry || null,
      website: tenantForm.website || null,
    });

    if (error) {
      setTenantError(error.message);
    } else {
      setTenantForm({ name: "", industry: "", website: "" });
      setShowAddTenant(false);
      loadData();
    }
    setTenantSaving(false);
  }

  async function handleAddCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCampaignError(null);
    setCampaignSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("campaigns").insert({
      tenant_id: showAddCampaign!,
      name: campaignForm.name,
      platform: campaignForm.platform || null,
      status: campaignForm.status,
      start_date: campaignForm.start_date || null,
    });

    if (error) {
      setCampaignError(error.message);
    } else {
      setCampaignForm({ name: "", platform: "", status: "active", start_date: "" });
      setShowAddCampaign(null);
      loadData();
    }
    setCampaignSaving(false);
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-gray-400 mt-1">Manage tenants and their campaigns</p>
        </div>
        <button
          onClick={() => setShowAddTenant(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          Add Tenant
        </button>
      </div>

      {/* Add Tenant Modal */}
      {showAddTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl bg-gray-900 border border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold">New Tenant</h3>
            <form onSubmit={handleAddTenant} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Tenant name"
                value={tenantForm.name}
                onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Industry (optional)"
                value={tenantForm.industry}
                onChange={(e) => setTenantForm({ ...tenantForm, industry: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="url"
                placeholder="Website (optional)"
                value={tenantForm.website}
                onChange={(e) => setTenantForm({ ...tenantForm, website: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
              {tenantError && <p className="text-sm text-red-400">{tenantError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTenant(false)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tenantSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {tenantSaving ? "Saving..." : "Add Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl bg-gray-900 border border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold">New Campaign</h3>
            <form onSubmit={handleAddCampaign} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Campaign name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
              <select
                value={campaignForm.platform}
                onChange={(e) => setCampaignForm({ ...campaignForm, platform: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select platform...</option>
                <option value="google_ads">Google Ads</option>
                <option value="meta">Meta (Facebook/Instagram)</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="microsoft_ads">Microsoft Ads</option>
                <option value="other">Other</option>
              </select>
              <select
                value={campaignForm.status}
                onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
              <input
                type="date"
                value={campaignForm.start_date}
                onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
              {campaignError && <p className="text-sm text-red-400">{campaignError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCampaign(null)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={campaignSaving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {campaignSaving ? "Saving..." : "Add Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant list */}
      {loading ? (
        <p className="text-gray-500">Loading tenants...</p>
      ) : tenants.length === 0 ? (
        <div className="rounded-lg border border-gray-800 p-10 text-center text-gray-500">
          No tenants yet. Click &ldquo;Add Tenant&rdquo; to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => {
            const tenantCampaigns = campaigns.filter(
              (c) => c.tenant_id === tenant.id
            );
            const isExpanded = expandedTenant === tenant.id;

            return (
              <div
                key={tenant.id}
                className="rounded-lg border border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedTenant(isExpanded ? null : tenant.id)
                  }
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-900/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-white">{tenant.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      {tenant.industry && <span>{tenant.industry}</span>}
                      {tenant.website && <span>{tenant.website}</span>}
                      <span>
                        {tenantCampaigns.length} campaign
                        {tenantCampaigns.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800 bg-gray-900/30 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Campaigns
                      </h4>
                      <button
                        onClick={() => setShowAddCampaign(tenant.id)}
                        className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium hover:bg-gray-700 transition-colors"
                      >
                        + Add Campaign
                      </button>
                    </div>
                    {tenantCampaigns.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No campaigns yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {tenantCampaigns.map((camp) => (
                          <div
                            key={camp.id}
                            className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-white">
                                {camp.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {camp.platform
                                  ? camp.platform.replace("_", " ")
                                  : "No platform"}{" "}
                                &middot;{" "}
                                {camp.start_date
                                  ? new Date(
                                      camp.start_date
                                    ).toLocaleDateString()
                                  : "No start date"}
                              </p>
                            </div>
                            <StatusBadge status={camp.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    paused: "bg-amber-500/20 text-amber-400",
    completed: "bg-blue-500/20 text-blue-400",
    draft: "bg-gray-500/20 text-gray-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[status] ?? colors.draft
      }`}
    >
      {status}
    </span>
  );
}
