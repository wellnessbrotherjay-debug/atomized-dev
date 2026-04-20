"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DecisionContext {
  id: string;
  decision_title: string;
  decision_reason: string;
  context_type: string;
  created_at: string;
  effective_from: string | null;
  status: string;
}

const OUTCOMES = [
  { value: "positive", label: "Positive", color: "text-emerald-400 bg-emerald-400/10" },
  { value: "negative", label: "Negative", color: "text-red-400 bg-red-400/10" },
  { value: "neutral", label: "Neutral", color: "text-gray-400 bg-gray-400/10" },
  { value: "mixed", label: "Mixed", color: "text-orange-400 bg-orange-400/10" },
  { value: "inconclusive", label: "Inconclusive", color: "text-blue-400 bg-blue-400/10" },
];

export default function DecisionImpactPage() {
  const [pendingDecisions, setPendingDecisions] = useState<DecisionContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const loadPending = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // In a real app, we'd fetch decisions that are > 5 days old and have no entry in decision_impact_reviews
    const { data: decisions } = await supabase
      .from("optimization_log")
      .select("*")
      .order("created_at", { ascending: false });

    // Simulate "Pending Review" status
    setPendingDecisions(decisions || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleReview = async (decisionId: string, status: string) => {
    setReviewing(decisionId);
    const supabase = createClient();
    
    // Log the impact
    await supabase.from("decision_impact_reviews").insert({
      tenant_id: (pendingDecisions.find(d => d.id === decisionId) as any).tenant_id,
      decision_context_id: decisionId,
      review_window_start: new Date().toISOString().split('T')[0],
      review_window_end: new Date().toISOString().split('T')[0],
      measured_metrics: { roas_lift: 0.05 }, // Mock metric
      outcome_status: status,
      outcome_summary: "Review submitted via Impact Hub.",
    });

    // Mark decision as reviewed in local state
    setPendingDecisions(prev => prev.filter(d => d.id !== decisionId));
    setReviewing(null);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">Decision Impact Hub</h1>
        <p className="text-gray-400 mt-2">Close the loop on strategy. Evaluate outcome data against intended hypotheses.</p>
      </div>

      {loading ? (
        <div className="p-20 text-center text-gray-500 animate-pulse">Syncing decision history...</div>
      ) : pendingDecisions.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 border-dashed p-20 text-center">
            <p className="text-gray-500">No decisions pending impact review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
             <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
             Pending Outcome Assessment ({pendingDecisions.length})
          </div>
          
          {pendingDecisions.map((dec) => (
            <div key={dec.id} className="group rounded-2xl border border-gray-800 bg-gray-900/30 p-8 hover:bg-gray-900/50 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20 uppercase">
                      {dec.context_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-500">
                      Logged {new Date(dec.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{dec.decision_title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{dec.decision_reason}</p>
                </div>

                <div className="shrink-0 space-y-4">
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Select Outcome Status</p>
                   <div className="flex flex-wrap gap-2 justify-center">
                      {OUTCOMES.map(o => (
                        <button
                          key={o.value}
                          disabled={reviewing === dec.id}
                          onClick={() => handleReview(dec.id, o.value)}
                          className={`px-4 py-2 rounded-xl border border-gray-800 text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ${o.color}`}
                        >
                          {o.label}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800 flex items-center justify-between">
                 <div className="flex gap-10">
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Status</p>
                      <p className="text-xs text-amber-500 font-bold">Awaiting Review</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Window</p>
                      <p className="text-xs text-gray-400">7 Days Post-Change</p>
                    </div>
                 </div>
                 <button className="text-[10px] font-bold text-gray-500 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                    View Performance Data 
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
