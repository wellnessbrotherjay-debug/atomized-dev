"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import { 
  Zap, 
  Presentation, 
  TrendingUp, 
  Target, 
  MessageSquare, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from "lucide-react";
import { generatePitchDeck } from "@/lib/reporting/ppt-service";
import { FormattedDate } from "@/components/ui/formatted-date";
import { useReporting } from "@/lib/hooks/use-reporting";

interface OptimizationEvent {
  id: string;
  description: string;
  change_type: string;
  effective_date: string;
  metadata?: any;
}

const MOCK_PERFORMANCE_DATA = [
  { date: "2026-04-01", cpl: 12.5, leads: 45, spend: 560 },
  { date: "2026-04-03", cpl: 11.8, leads: 48, spend: 566 },
  { date: "2026-04-05", cpl: 14.2, leads: 42, spend: 596 },
  { date: "2026-04-07", cpl: 13.1, leads: 50, spend: 655 },
  { date: "2026-04-09", cpl: 11.5, leads: 58, spend: 667 }, // Pivoted here
  { date: "2026-04-11", cpl: 10.2, leads: 65, spend: 663 },
  { date: "2026-04-13", cpl: 9.80, leads: 72, spend: 705 },
  { date: "2026-04-15", cpl: 10.5, leads: 68, spend: 714 },
  { date: "2026-04-17", cpl: 9.10, leads: 85, spend: 773 },
  { date: "2026-04-20", cpl: 8.90, leads: 92, spend: 818 },
];

export default function IntelligenceHub() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [events, setEvents] = useState<OptimizationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiNarrative, setAiNarrative] = useState<any>(null);
  const { getReportPreview, loading: aiLoading } = useReporting();

  useEffect(() => {
    setMounted(true);
    if (wsLoading || !workspace) return;

    async function loadEvents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("optimization_log")
        .select("*")
        .eq("tenant_id", workspace?.id)
        .order("effective_date", { ascending: false });

      if (data) setEvents(data);
      
      // Fetch AI Insight Preview
      const preview = await getReportPreview(
        workspace?.id || "", 
        "2026-04-01", 
        "2026-04-20"
      );
      if (preview) setAiNarrative(preview);
      
      setLoading(false);
    }

    loadEvents();
  }, [workspace, wsLoading, getReportPreview]);

  const handleExportPPT = async () => {
    setGenerating(true);
    try {
      await generatePitchDeck({
        clientName: workspace?.name || "Client",
        projectName: "Media Performance & Strategic Alignment",
        dateRange: "April 2026",
        summary: "Performance has optimized significantly following strategic creative refreshes and budget reallocation toward high-converting audience segments.",
        metrics: [
          { label: "Cost Per Lead", value: "$8.90", change: "-28.8%" },
          { label: "Total Leads", value: "615", change: "+42.1%" },
          { label: "ROAS", value: "4.2x", change: "+15.5%" },
        ],
        strategicNotes: events.slice(0, 5).map(e => ({
          date: e.effective_date,
          type: e.change_type,
          description: e.description
        }))
      });
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  if (wsLoading) return <div className="p-10 text-gray-500">Initializing Intelligence Hub...</div>;
  if (!workspace) return <WorkspacePicker />;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Decision Intelligence</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Intelligence Hub</h1>
          <p className="text-gray-400 mt-2 max-w-xl">
            Correlating your strategic pivots with real-world performance impact for <span className="text-white font-medium">{workspace.name}</span>.
          </p>
        </div>
        
        <button 
          onClick={handleExportPPT}
          disabled={generating}
          className="flex items-center gap-3 bg-white text-black px-6 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
        >
          <Presentation className="w-5 h-5" />
          {generating ? "Building Deck..." : "Generate Pitch Deck"}
        </button>
      </div>
      {/* AI Strategic Narrative Section */}
      <div className="mb-12 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 p-8 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="w-32 h-32 text-indigo-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">SIGNAL AI Narrative</h2>
            </div>
            <button className="text-xs font-bold text-indigo-400 hover:text-white uppercase tracking-widest border border-indigo-500/30 px-4 py-2 rounded-full transition-colors">
              Regenerate Section
            </button>
          </div>

          {aiLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded w-5/6"></div>
              <div className="h-4 bg-gray-800 rounded w-2/3"></div>
            </div>
          ) : aiNarrative ? (
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-200 leading-relaxed italic">
                "{aiNarrative.narrative_insight}"
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {aiNarrative.strategic_recap?.slice(0, 3).map((item: any, idx: number) => (
                  <span key={idx} className="text-[10px] font-bold uppercase tracking-widest bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-md text-gray-400">
                    Signal: {item.type}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Wait, it looks like we need to run an analysis to get your strategic narrative.</p>
          )}
        </div>
      </div>

      {/* Hero Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 rounded-3xl border border-gray-800 bg-gray-900/50 p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Decision Impact Analysis
            </h3>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> CPL</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Leads</span>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_PERFORMANCE_DATA}>
                <defs>
                  <linearGradient id="colorCpl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="cpl" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCpl)" />
                
                {/* Vertical markers for decisions */}
                {events.map((event, idx) => (
                  <ReferenceLine 
                    key={event.id}
                    x={event.effective_date} 
                    stroke="#F59E0B" 
                    strokeDasharray="5 5"
                    label={{ position: 'top', value: 'Pivot', fill: '#F59E0B', fontSize: 10 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700">Loading Analysis...</div>
            )}
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
          <MetricCard 
            label="Efficiency Delta" 
            value="-28.4%" 
            trend="down" 
            sub="Avg Cost Per Lead" 
            icon={<Target className="w-6 h-6 text-indigo-400" />}
          />
          <MetricCard 
            label="Strategic Density" 
            value={String(events.length)} 
            trend="up" 
            sub="Pivots this month" 
            icon={<Zap className="w-6 h-6 text-amber-400" />}
          />
          <MetricCard 
            label="Confidence Score" 
            value="94/100" 
            trend="up" 
            sub="Based on ROI signal" 
            icon={<Sparkles className="w-6 h-6 text-emerald-400" />}
          />
        </div>
      </div>

      {/* Decision Audit Trail */}
      <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-8">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          Strategic Audit Trail
        </h3>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-gray-500 animate-pulse">Syncing context layer...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-2xl text-gray-500">
              No strategic decisions logged for this period.
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="group relative pl-8 pb-10 last:pb-0">
                {/* Timeline connector */}
                <div className="absolute left-[11px] top-2 bottom-0 w-px bg-gray-800 group-last:bg-transparent"></div>
                <div className="absolute left-0 top-2 w-6 h-6 rounded-full border-4 border-gray-950 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 uppercase tracking-tighter">
                      {event.change_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <FormattedDate date={event.effective_date} />
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-800/30 border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition-all">
                  <h4 className="font-bold text-indigo-100 mb-2">{event.metadata?.title || "Operational Optimization"}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, sub, icon }: { label: string, value: string, trend: 'up' | 'down', sub: string, icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-md hover:border-indigo-500/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-2xl bg-gray-950 border border-gray-800 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trend === 'up' ? '+12%' : '-8%'}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs text-gray-400 mt-2">{sub}</p>
    </div>
  );
}
