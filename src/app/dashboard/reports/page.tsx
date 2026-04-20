"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";
import { FormattedDate } from "@/components/ui/formatted-date";

interface ReportData {
  decisions: any[];
  events: any[];
  reviews: any[];
  narrative?: string;
  metrics?: {
    total_spend: number;
    avg_roas: number;
  };
}

export default function ReportsPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [selectedTenant, setSelectedTenant] = useState("");
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("monthly_strategic");

  useEffect(() => {
    if (wsLoading || !workspace) return;
    async function load() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${backendUrl}/api/tenants/?workspace_id=${workspace.id}`);
        const data = await res.json();
        setTenants(data || []);
        
        // Auto-select the first brand found
        if (data && data.length > 0) {
          setSelectedTenant(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load brands for report engine:", err);
      }
    }
    load();
  }, [workspace, wsLoading]);

  const generatePreview = async () => {
    if (!selectedTenant) return;
    setLoading(true);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const start = "2026-04-01";
      const end = "2026-04-30";
      
      const response = await fetch(
        `${backendUrl}/api/reports/preview/${selectedTenant}?period_start=${start}&period_end=${end}`
      );
      const data = await response.json();
      
      setReportData({
        decisions: data.strategic_recap || [],
        events: data.raw_data_preview || [],
        reviews: [],
        narrative: data.narrative_insight,
        metrics: data.aggregate_metrics
      });
    } catch (err) {
      console.error("Failed to fetch narrative report:", err);
      // Fallback
      setReportData({
        decisions: [],
        events: [],
        reviews: [],
        narrative: "Failed to connect to Intelligence Backend.",
        metrics: { total_spend: 0, avg_roas: 0 }
      });
    }
    
    setLoading(false);
  };

  if (wsLoading) return <div className="p-10 text-gray-500">Loading...</div>;
  if (!workspace) return <WorkspacePicker />;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Narrative Report Engine
          </h1>
          <p className="text-gray-400 mt-2">Generate context-aware client reports that explain the "Why" behind the data.</p>
        </div>
        
        <div className="flex gap-4">
           <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white outline-none"
          >
            <option value="monthly_strategic">Monthly Strategy Recap</option>
            <option value="weekly_pacing">Weekly Pacing Report</option>
            <option value="campaign_deep_dive">Campaign Deep Dive</option>
          </select>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select Tenant...</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button 
            onClick={generatePreview}
            disabled={!selectedTenant || loading}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white hover:bg-indigo-500 transition-all disabled:opacity-50"
          >
            {loading ? "Synthesizing..." : "Preview Report"}
          </button>
        </div>
      </div>

      {!reportData ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-20 text-center">
            <div className="text-5xl mb-6 opacity-20">&#x1F4D6;</div>
            <h3 className="text-xl font-bold text-white mb-2">Ready for Narrative Generation</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Select a tenant and report type to synthesize metrics, platform events, 
              and strategic decisions into a narrative summary.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          {/* Controls & Export */}
          <div className="xl:col-span-1 space-y-6">
             <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Report Controls</h4>
                <div className="space-y-4">
                  <button className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PowerPoint
                  </button>
                  <button className="w-full rounded-xl border border-gray-800 py-3 text-xs font-bold text-gray-400 hover:bg-gray-800 transition-all">
                    Share Web Link
                  </button>
                </div>
             </div>
             
             <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Meta Data</h4>
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-600">Tenant: <span className="text-white">{tenants.find(t => t.id === selectedTenant)?.name}</span></p>
                  <p className="text-[10px] text-gray-600">Period: <span className="text-white">April 1, 2026 - April 30, 2026</span></p>
                  <p className="text-[10px] text-gray-600">Narrative Coverage: <span className="text-emerald-400 font-bold">95%</span></p>
                </div>
             </div>
          </div>

          {/* Preview Canvas */}
          <div className="xl:col-span-3">
             <div className="rounded-3xl border border-gray-800 bg-white shadow-2xl min-h-[800px] flex flex-col overflow-hidden text-slate-900">
                {/* Report Header */}
                <div className="bg-slate-900 p-12 text-white">
                  <div className="mb-4 text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Marketing Intelligence Report</div>
                  <h2 className="text-4xl font-extrabold mb-4">{tenants.find(t => t.id === selectedTenant)?.name} Strategy Recap</h2>
                  <div className="flex gap-10">
                    <div>
                      <p className="text-[10px] font-bold opacity-40 uppercase mb-1">Period</p>
                      <p className="text-sm font-medium">April 2026</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold opacity-40 uppercase mb-1">Spend Efficiency</p>
                      <p className="text-sm font-medium text-emerald-400">
                        {reportData.metrics ? `$${reportData.metrics.total_spend.toLocaleString()}` : 'Calculating...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-12 space-y-16">
                  {/* Section: Strategic Narrative */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Strategic Narrative</h3>
                    <div className="space-y-6">
                      <p className="text-lg text-slate-600 leading-relaxed font-serif">
                        {reportData.narrative || "Synthesizing strategic insights..."}
                      </p>
                      {reportData.decisions.map((dec: any) => (
                        <div key={dec.id} className="border-l-4 border-indigo-500 pl-6 py-2">
                           <p className="text-sm font-bold text-slate-900 mb-1">{dec.title}</p>
                           <p className="text-xs text-slate-500 leading-relaxed italic">
                             Log Entry: "{dec.reason}"
                           </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section: Performance Events */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Operational Continuity (Historical Log)</h3>
                    <div className="space-y-4">
                      {reportData.events.slice(0, 3).map((evt: any) => (
                        <div key={evt.id} className="flex gap-4 items-start p-4 rounded-xl bg-slate-50 border border-slate-100">
                           <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                             <span className="text-[10px] font-bold text-indigo-600">{evt.source_platform[0].toUpperCase()}</span>
                           </div>
                           <div>
                             <p className="text-xs font-bold text-slate-800">{evt.change_type.replace(/_/g, " ")}</p>
                             <p className="text-[10px] text-slate-500 mt-0.5">Detected on <FormattedDate date={evt.platform_event_timestamp} /></p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section: Outcomes */}
                  <section>
                    <div className="rounded-2xl bg-indigo-600 p-10 text-white shadow-xl shadow-indigo-600/20">
                       <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest mb-6">Executive Summary</h3>
                       <div className="grid grid-cols-2 gap-10">
                         <div>
                            <p className="text-3xl font-bold mb-2">Outcome: Validated</p>
                            <p className="text-sm opacity-80 leading-relaxed">
                              90% of the decisions logged this month resulted in positive performance shifts, 
                              validating the current scale-first strategy.
                            </p>
                         </div>
                         <div className="flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full border-8 border-indigo-400 border-t-white animate-[spin_3s_linear_infinite]"></div>
                         </div>
                       </div>
                    </div>
                  </section>
                </div>

                <div className="mt-auto p-12 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atomized Marketing Intelligence</div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page 1 of 4</div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
