"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";

interface SummaryData {
  totalClients: number;
  totalCampaigns: number;
  totalMetricEntries: number;
  recentChanges: {
    id: string;
    description: string;
    category: string;
    changed_at: string;
    client_name?: string;
  }[];
}

export default function DashboardPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wsLoading || !workspace) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      const supabase = createClient();

      const [clientsRes, campaignsRes, metricsRes, changesRes] =
        await Promise.all([
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspace!.id),
          supabase
            .from("campaigns")
            .select("id, clients!inner(workspace_id)", {
              count: "exact",
              head: true,
            })
            .eq("clients.workspace_id", workspace!.id),
          supabase
            .from("metrics")
            .select("id, clients!inner(workspace_id)", {
              count: "exact",
              head: true,
            })
            .eq("clients.workspace_id", workspace!.id),
          supabase
            .from("change_log")
            .select("id, description, category, changed_at, clients!inner(name, workspace_id)")
            .eq("clients.workspace_id", workspace!.id)
            .order("changed_at", { ascending: false })
            .limit(10),
        ]);

      setData({
        totalClients: clientsRes.count ?? 0,
        totalCampaigns: campaignsRes.count ?? 0,
        totalMetricEntries: metricsRes.count ?? 0,
        recentChanges:
          changesRes.data?.map((c) => ({
            id: c.id,
            description: c.description,
            category: c.category,
            changed_at: c.changed_at,
            client_name: (c.clients as unknown as { name: string })?.name,
          })) ?? [],
      });
      setLoading(false);
    }

    load();
  }, [workspace, wsLoading]);

  if (wsLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading...
      </div>
    );
  }

  if (!workspace) {
    return <WorkspacePicker />;
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Welcome to <span className="text-white font-medium">{workspace.name}</span>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <SummaryCard
          label="Total Clients"
          value={loading ? "..." : String(data?.totalClients ?? 0)}
          color="indigo"
        />
        <SummaryCard
          label="Total Campaigns"
          value={loading ? "..." : String(data?.totalCampaigns ?? 0)}
          color="emerald"
        />
        <SummaryCard
          label="Metric Entries"
          value={loading ? "..." : String(data?.totalMetricEntries ?? 0)}
          color="amber"
        />
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : data?.recentChanges.length === 0 ? (
          <div className="rounded-lg border border-gray-800 p-8 text-center text-gray-500">
            No recent activity. Start by adding clients and logging changes.
          </div>
        ) : (
          <div className="space-y-2">
            {data?.recentChanges.map((change) => (
              <div
                key={change.id}
                className="flex items-start gap-4 rounded-lg border border-gray-800 p-4"
              >
                <CategoryBadge category={change.category} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{change.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {change.client_name} &middot;{" "}
                    {new Date(change.changed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "indigo" | "emerald" | "amber";
}) {
  const colors = {
    indigo: "border-indigo-500/30 bg-indigo-500/5",
    emerald: "border-emerald-500/30 bg-emerald-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
  };
  const textColors = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };

  return (
    <div className={`rounded-lg border p-6 ${colors[color]}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${textColors[color]}`}>{value}</p>
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
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[category] ?? colors.other
      }`}
    >
      {category}
    </span>
  );
}
