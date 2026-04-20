"use client";

import { useWorkspace } from "@/lib/workspace-context";
import { MissingContextInbox } from "./missing-context";

export default function InsightsPage() {
  const { workspace } = useWorkspace();

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Intelligence & Insights
          </h1>
          <p className="text-gray-400 mt-2">Automated operational audit and performance driver analysis.</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={async () => {
                if (!workspace) return;
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                try {
                  const res = await fetch(`${backendUrl}/api/ingestion/trigger`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tenant_id: workspace.id, platform: 'google_ads' })
                  });
                  if (res.ok) alert("Ingestion sync triggered successfully from Intelligence Backend!");
                  else alert("Backend offline. Start the FastAPI service.");
                } catch (e) {
                  alert("Failed to connect to backend service.");
                }
             }}
             disabled={!workspace}
             className="px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all uppercase tracking-widest disabled:opacity-50"
           >
             Trigger Sync
           </button>
           <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             Audit Active
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Missing Context & Exceptions */}
        <div className="lg:col-span-1 space-y-10">
          <MissingContextInbox />
          
          <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Strategic Alerts</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Budget Anomaly</p>
                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                    Meta budget shifted 45% without an approved Decision Log or Media Plan alignment.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 opacity-60">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5"></div>
                <div>
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">Messaging Lag</p>
                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                    CPL increased 14% since "Trust-Led" angle refresh. Outcome review pending.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Drivers & Summaries */}
        <div className="lg:col-span-2 space-y-10">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Performance Driver Analysis</h2>
              <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-all">Generate Summary with AI</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-xl border border-gray-800 bg-black/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white">Scaling Wins</h4>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Scaling top-of-funnel on Meta by 20% led to a 12% improvement in overall ROAS, validated by the "Scale Momentum" decision log.
                </p>
                <div className="flex gap-2">
                  <span className="text-[8px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 uppercase">Scale</span>
                  <span className="text-[8px] font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 uppercase">Validated</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-black/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a2 2 0 002 2 2 2 0 110 4 2 2 0 00-2 2v1a2 2 0 11-4 0 2 2 0 00-2-2 2 2 0 110-4 2 2 0 002-2V4z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white">Efficiency Leaks</h4>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Google Search CPL spiked due to landing page load speed latency in the UK region. Tracking issue logged by Ops team on April 18.
                </p>
                <div className="flex gap-2">
                  <span className="text-[8px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20 uppercase">Technical</span>
                  <span className="text-[8px] font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 uppercase">Open Issue</span>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 border-dashed">
              <div className="flex items-center gap-4 mb-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    <span className="text-indigo-400 text-xs text font-bold">AI</span>
                 </div>
                 <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-widest">Context-Aware Recommendation</h4>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                "Based on the high performance of the Trust-Led messaging on Meta and current Google search efficiency leaks, the system recommends shifting an additional 15% of the UK budget from Google to Meta for the remainder of the month."
              </p>
              <div className="mt-4 flex gap-4">
                <button className="text-xs font-bold text-indigo-400 hover:text-white transition-all underline decoration-indigo-500/30">Review Decision Logic</button>
                <button className="text-xs font-bold text-indigo-400 hover:text-white transition-all underline decoration-indigo-500/30">Draft Media Plan Update</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
