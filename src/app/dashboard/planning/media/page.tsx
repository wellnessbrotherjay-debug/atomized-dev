"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";

interface Tenant {
  id: string;
  name: string;
}

interface MediaPlan {
  id: string;
  name: string;
  period_start: string;
  period_end: string;
  total_budget: number;
  status: string;
}

export default function MediaPlanningPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [plans, setPlans] = useState<MediaPlan[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [planName, setPlanName] = useState("");
  const [budget, setBudget] = useState("0");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

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

  // Load plans
  const loadPlans = async () => {
    if (!selectedTenant) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("media_plans")
      .select("*")
      .eq("tenant_id", selectedTenant)
      .order("period_start", { ascending: false });
    setPlans((data ?? []) as MediaPlan[]);
    setLoading(false);
  };

  useEffect(() => {
    loadPlans();
  }, [selectedTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    
    await supabase.from("media_plans").insert({
      tenant_id: selectedTenant,
      name: planName,
      period_start: start,
      period_end: end,
      total_budget: parseFloat(budget),
      status: "active",
    });

    setPlanName("");
    setBudget("0");
    loadPlans();
    setSaving(false);
  };

  if (wsLoading) return <div className="p-10 text-gray-500">Loading...</div>;
  if (!workspace) return <WorkspacePicker />;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
       <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Media Planning Matrix
          </h1>
          <p className="text-gray-400 mt-2">Define budgets and cross-platform KPI targets for client approval.</p>
        </div>
        
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        >
          <option value="">Select Tenant...</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Form */}
        <div className="xl:col-span-1">
           <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 space-y-6 sticky top-10">
              <h3 className="text-lg font-semibold text-white">Create New Media Plan</h3>
              
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Plan Name</label>
                <input
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Q4 Performance Strategy"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Total Monthly Budget</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 pl-8 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !selectedTenant}
                className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Initialize Media Plan"}
              </button>
           </form>
        </div>

        {/* List */}
        <div className="xl:col-span-2">
           {!selectedTenant ? (
             <div className="rounded-2xl border border-gray-800 border-dashed p-20 text-center">
               <p className="text-gray-500 font-medium">Please select a tenant to manage media plans.</p>
             </div>
           ) : loading ? (
             <div className="p-20 text-center animate-pulse text-gray-400">Fetching allocation data...</div>
           ) : plans.length === 0 ? (
             <div className="rounded-2xl border border-gray-800 border-dashed p-20 text-center">
               <p className="text-gray-500 font-medium">No media plans defined for this tenant.</p>
             </div>
           ) : (
             <div className="space-y-6">
                {plans.map(p => (
                   <div key={p.id} className="rounded-2xl border border-gray-800 bg-gray-900/20 p-8 hover:bg-gray-900/40 transition-all">
                      <div className="flex items-center justify-between mb-8">
                         <div>
                            <h4 className="text-xl font-bold text-white mb-2">{p.name}</h4>
                            <p className="text-xs text-gray-500">
                               {new Date(p.period_start).toLocaleDateString()} &mdash; {new Date(p.period_end).toLocaleDateString()}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Total Allotment</p>
                            <p className="text-2xl font-bold text-emerald-400">${p.total_budget.toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Google Search</p>
                            <div className="flex items-center justify-between">
                               <span className="text-sm font-bold text-white">$12,000</span>
                               <span className="text-[10px] text-gray-600">40%</span>
                            </div>
                         </div>
                         <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Meta Ads</p>
                            <div className="flex items-center justify-between">
                               <span className="text-sm font-bold text-white">$15,000</span>
                               <span className="text-[10px] text-gray-600">50%</span>
                            </div>
                         </div>
                         <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 border-dashed flex items-center justify-center">
                             <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-all">+ Add Channel</button>
                         </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-gray-800 flex items-center justify-between">
                         <div className="flex gap-4">
                            <span className="rounded-full px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">{p.status}</span>
                            <span className="rounded-full px-3 py-1 bg-gray-800 text-gray-400 text-[10px] font-bold uppercase border border-gray-700">Internal Draft</span>
                         </div>
                         <div className="flex gap-4">
                            <button className="text-xs font-bold text-gray-500 hover:text-white transition-all">Export PDF</button>
                            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all">Submit for client approval</button>
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
