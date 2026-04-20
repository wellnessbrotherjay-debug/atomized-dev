"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { 
  Link2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ExternalLink, 
  Database,
  ArrowRight
} from "lucide-react";
import { AddConnectionModal } from "@/components/modals/add-connection-modal";
import { AccountSelectorModal } from "@/components/modals/account-selector-modal";

interface Connection {
  id: string;
  source_type: string;
  account_label: string;
  external_account_id?: string;
  status: string;
  last_synced_at: string | null;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function ConnectionsPage() {
  const { workspace } = useWorkspace();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [selectorConnection, setSelectorConnection] = useState<{id: string, type: string} | null>(null);

  useEffect(() => {
    if (!workspace) return;

    async function load() {
      setLoading(true);
      setConnectionError(false);
      try {
        // 1. Find the tenant for this workspace
        const tenantRes = await fetch(`${BACKEND_URL}/api/tenants/?workspace_id=${workspace?.id}`);
        let tenants = await tenantRes.json();
        
        // AUTO-INIT FALLBACK: Create a tenant if none exists
        if (tenants.length === 0) {
           const createRes = await fetch(`${BACKEND_URL}/api/tenants/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                name: `${workspace?.name} Brand`, 
                slug: `${workspace?.id?.slice(0,8)}-brand`,
                workspace_id: workspace?.id
              })
           });
           if (createRes.ok) {
              const newTenant = await createRes.json();
              tenants = [newTenant];
           }
        }

        if (tenants.length > 0) {
          const tenantId = tenants[0].id;
          setActiveTenantId(tenantId);
          
          // 2. Load connections for this tenant
          const connRes = await fetch(`${BACKEND_URL}/api/ingestion/connections?tenant_id=${tenantId}`);
          if (connRes.ok) {
            const data = await connRes.json();
            setConnections(data);

            // AUTO-TRIGGER: If a connection just finished OAuth but has no ID, open selector
            const pending = data.find((c: Connection) => c.status === 'active' && !c.external_account_id);
            if (pending) {
              setSelectorConnection({ id: pending.id, type: pending.source_type });
            }
          }
        } else {
          setActiveTenantId(null);
          setConnections([]);
        }
      } catch (err) {
        console.error("Failed to load connections:", err);
        setConnectionError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [workspace]);

  const triggerSync = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/ingestion/connections/${id}/sync`, { method: "POST" });
      alert("Sync triggered successfully!");
    } catch (err) {
      alert("Failed to trigger sync.");
    }
  };

  if (!workspace) return <div className="p-10 text-gray-500">Select a workspace to manage connections.</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Data Connections</h1>
          <p className="text-gray-400 mt-2 max-w-xl">
            Integrate your marketing platforms directly into the Agency OS warehouse.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={!activeTenantId || connectionError}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:grayscale"
        >
          <Plus className="w-5 h-5" />
          Add New Source
        </button>
      </div>

      {connectionError && (
        <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Backend connection failed. Please ensure your Python server is running on port 8000.</p>
        </div>
      )}

      {isModalOpen && activeTenantId && (
        <AddConnectionModal 
          tenantId={activeTenantId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
             // Reload connections
             window.location.reload();
          }}
        />
      )}

      {selectorConnection && (
        <AccountSelectorModal
          connectionId={selectorConnection.id}
          sourceType={selectorConnection.type}
          onClose={() => setSelectorConnection(null)}
          onSuccess={() => {
            setSelectorConnection(null);
            window.location.reload();
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl border border-gray-800 bg-gray-900/50 animate-pulse"></div>
          ))
        ) : connections.length === 0 ? (
          <div className="col-span-full p-20 text-center border-2 border-dashed border-gray-800 rounded-3xl group hover:border-indigo-500/50 transition-colors">
            <Link2 className="w-12 h-12 text-gray-700 mx-auto mb-4 group-hover:text-indigo-400 transition-colors" />
            <h3 className="text-xl font-bold text-gray-300">No active connections</h3>
            <p className="text-gray-500 mt-2 mb-8">Connect your first source to start generating strategic insights.</p>
            <button className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300">
              View Supported Connectors <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          connections.map((conn) => (
            <ConnectionCard 
              key={conn.id} 
              connection={conn} 
              onSync={triggerSync} 
              onConfigure={() => setSelectorConnection({ id: conn.id, type: conn.source_type })}
            />
          ))
        )}
      </div>

      {/* Scaffolding for available connectors */}
      <h3 className="text-lg font-bold mt-16 mb-8 text-gray-400 uppercase tracking-widest px-2">Marketplace Connectors</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {['Google Ads', 'Meta Ads', 'LinkedIn Ads', 'TikTok Ads', 'Shopify', 'GA4'].map((name) => (
          <div key={name} className="p-6 rounded-2xl border border-gray-800 bg-gray-900/30 flex flex-col items-center justify-center gap-3 hover:bg-gray-800/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors text-gray-400 group-hover:text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectionCard({ 
  connection, 
  onSync, 
  onConfigure 
}: { 
  connection: Connection, 
  onSync: (id: string) => void,
  onConfigure: () => void
}) {
  const needsConfig = !connection.external_account_id;

  return (
    <div className={`rounded-3xl border p-8 flex flex-col justify-between transition-all group ${
      needsConfig ? 'border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10' : 'border-gray-800 bg-gray-900/50 hover:border-indigo-500/30'
    }`}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 rounded-2xl bg-gray-950 border border-gray-800 group-hover:border-indigo-500/20 transition-all">
            <Link2 className="w-6 h-6 text-indigo-400" />
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
            connection.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {connection.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {connection.status.toUpperCase()}
          </span>
        </div>
        
        <h3 className="text-xl font-bold mb-1">{connection.account_label || connection.source_type}</h3>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-tighter">{connection.source_type.replace('_', ' ')}</p>

        {needsConfig && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium animate-pulse">
            Selection Required: Choose an account to begin ingestion.
          </div>
        )}
      </div>

      <div className="mt-12 flex items-center justify-between">
        <div className="text-xs">
          <p className="text-gray-500 mb-0.5">Last Sync</p>
          <p className="font-medium text-gray-300">{connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleDateString() : 'Never'}</p>
        </div>
        
        <div className="flex gap-2">
          {needsConfig ? (
            <button 
              onClick={onConfigure}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              Complete Setup
            </button>
          ) : (
            <button 
              onClick={() => onSync(connection.id)}
              className="p-3 rounded-xl bg-gray-950 border border-gray-800 hover:text-indigo-400 hover:border-indigo-500/30 transition-all active:scale-90"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
