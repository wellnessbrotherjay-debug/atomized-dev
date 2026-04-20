"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";

interface Tenant {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  tenant_id: string;
}

interface MessagingVersion {
  id: string;
  version_number: number;
  message_title: string;
  primary_angle: string;
  prompt_text: string | null;
  copy_text: string | null;
  status: string;
  created_at: string;
  campaign_id: string | null;
}

export default function MessagingVersioningPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [versions, setVersions] = useState<MessagingVersion[]>([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formAngle, setFormAngle] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formCopy, setFormCopy] = useState("");
  const [formCampaign, setFormCampaign] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  // Load campaigns
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

  // Load versions
  const loadVersions = useCallback(async () => {
    if (!selectedTenant) {
      setVersions([]);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("messaging_versions")
      .select("*")
      .eq("tenant_id", selectedTenant)
      .order("version_number", { ascending: false });

    if (selectedCampaign) {
      query = query.eq("campaign_id", selectedCampaign);
    }

    const { data } = await query;
    setVersions((data ?? []) as MessagingVersion[]);
    setLoading(false);
  }, [selectedTenant, selectedCampaign]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant) {
      setSaveError("Please select a tenant.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    const supabase = createClient();
    
    // Get next version number for this tenant
    const { data: latest } = await supabase
      .from("messaging_versions")
      .select("version_number")
      .eq("tenant_id", selectedTenant)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latest?.version_number ?? 0) + 1;

    const { error } = await supabase.from("messaging_versions").insert({
      tenant_id: selectedTenant,
      campaign_id: formCampaign || null,
      version_number: nextVersion,
      message_title: formTitle,
      primary_angle: formAngle,
      prompt_text: formPrompt || null,
      copy_text: formCopy || null,
      status: "draft",
    });

    if (error) {
      setSaveError(error.message);
    } else {
      setFormTitle("");
      setFormAngle("");
      setFormPrompt("");
      setFormCopy("");
      loadVersions();
    }
    setSaving(false);
  }

  async function handleMarkLive(versionId: string) {
    const supabase = createClient();
    
    // In a real app, we'd first mark all other versions for this campaign as 'archived' or 'draft'
    // but for now we'll just set this one to live.
    const { error } = await supabase
      .from("messaging_versions")
      .update({ status: "live" })
      .eq("id", versionId);

    if (!error) {
      loadVersions();
    }
  }

  if (wsLoading) return <div className="p-10 text-gray-500">Loading...</div>;
  if (!workspace) return <WorkspacePicker />;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Messaging & Prompt Versioning
          </h1>
          <p className="text-gray-400 mt-2">Iterate on campaign angles, hooks, and AI prompts with full version control.</p>
        </div>
        
        <div className="flex gap-4">
          <select
            value={selectedTenant}
            onChange={(e) => {
              setSelectedTenant(e.target.value);
              setSelectedCampaign("");
            }}
            className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="">Select Tenant...</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            disabled={!selectedTenant}
            className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
          >
            <option value="">All Campaigns</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Creation Form */}
        <div className="xl:col-span-1">
          <div className="sticky top-10">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                New Messaging Version
              </h3>
              
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Message Title</label>
                <input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Q4 Awareness Refresh"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Primary Angle</label>
                <input
                  required
                  value={formAngle}
                  onChange={(e) => setFormAngle(e.target.value)}
                  placeholder="e.g. Urgent Scarcity"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Target Campaign</label>
                <select
                  value={formCampaign}
                  onChange={(e) => setFormCampaign(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">General Client Messaging</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Prompt / Instructions</label>
                <textarea
                  rows={4}
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="AI Prompt used or instructions for the creative team..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Final Copy Preview</label>
                <textarea
                  rows={4}
                  value={formCopy}
                  onChange={(e) => setFormCopy(e.target.value)}
                  placeholder="Paste the final ad copy here..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              {saveError && <p className="text-sm text-red-400">{saveError}</p>}

              <button
                type="submit"
                disabled={saving || !selectedTenant}
                className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Creating Version..." : "Save Version"}
              </button>
            </form>
          </div>
        </div>

        {/* Version Timeline */}
        <div className="xl:col-span-2">
          {!selectedTenant ? (
            <div className="rounded-2xl border border-gray-800 border-dashed p-20 text-center">
              <p className="text-gray-500">Please select a tenant to view messaging versions.</p>
            </div>
          ) : loading ? (
            <div className="p-20 text-center animate-pulse text-gray-400 font-medium">Fetching version timeline...</div>
          ) : versions.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 border-dashed p-20 text-center">
              <p className="text-gray-500 font-medium">No messaging versions tracked yet for this tenant.</p>
              <p className="text-xs text-gray-600 mt-2">Start by creating Version 1 using the form.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {versions.map((v) => (
                <div key={v.id} className="group relative rounded-2xl border border-gray-800 bg-gray-900/20 p-8 hover:bg-gray-900/40 transition-all">
                  <div className="absolute top-8 left-[-11px] w-[2px] h-full bg-gray-800 hidden xl:block group-last:hidden"></div>
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold">
                        <span className="text-[10px] text-indigo-500/50 leading-none">V</span>
                        <span className="text-lg">{v.version_number}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{v.message_title}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          {new Date(v.created_at).toLocaleDateString()} &middot; 
                          <span className="text-indigo-400/80 uppercase tracking-tighter font-extrabold">{v.primary_angle}</span>
                        </p>
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      v.status === 'live' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}>
                      {v.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="text-[10px] font-bold text-gray-600 uppercase mb-3 tracking-widest">Prompt / Source</h5>
                      <div className="rounded-xl border border-gray-800 bg-black/40 p-4 min-h-[100px] text-xs text-gray-400 leading-relaxed font-mono">
                        {v.prompt_text || "No prompt details recorded."}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-gray-600 uppercase mb-3 tracking-widest">Draft / Output</h5>
                      <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-4 min-h-[100px] text-xs text-gray-300 leading-relaxed">
                        {v.copy_text || "No copy preview recorded."}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-400">JG</div>
                    </div>
                    <div className="flex gap-4">
                      <button className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors">Compare with Previous</button>
                      <button 
                        onClick={() => handleMarkLive(v.id)}
                        disabled={v.status === 'live'}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-30"
                      >
                        {v.status === 'live' ? 'Currently Live' : 'Mark Live'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
