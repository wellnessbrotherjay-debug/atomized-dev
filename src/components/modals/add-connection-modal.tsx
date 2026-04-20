"use client";

import { useState } from "react";
import { 
  X, 
  Globe, 
  ShieldCheck, 
  Database, 
  ArrowRight, 
  ChevronLeft,
  Loader2
} from "lucide-react";

interface AddConnectionModalProps {
  onClose: () => void;
  onSuccess: (connectionId: string) => void;
  tenantId: string;
}

const PLATFORMS = [
  { id: "meta_ads", name: "Meta Ads", icon: "Facebook" },
  { id: "google_ads", name: "Google Ads", icon: "Google" },
  { id: "linkedin_ads", name: "LinkedIn Ads", icon: "Linkedin" },
  { id: "tiktok_ads", name: "TikTok Ads", icon: "Tiktok" },
];

export function AddConnectionModal({ onClose, onSuccess, tenantId }: AddConnectionModalProps) {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${backendUrl}/api/ingestion/connections/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          source_type: platform,
          account_label: `${platform?.replace('_', ' ')}: ${accountId}`,
          external_account_id: accountId,
          config: {
            access_token: token,
            api_version: "v18.0"
          }
        }),
      });

      if (!res.ok) throw new Error("Failed to create connection");
      
      const data = await res.json();
      onSuccess(data.id);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-gray-950 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/10">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                <Globe className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold">Connect Real Platform</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-10">
                <p className="text-gray-400">Choose a platform to integrate into the Agency OS Intelligence warehouse.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPlatform(p.id);
                      setStep(2);
                    }}
                    className="flex flex-col items-center gap-3 p-8 rounded-3xl border border-gray-800 bg-gray-900/30 hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-indigo-600/20 transition-colors">
                      <Database className="w-6 h-6 text-gray-400 group-hover:text-indigo-400" />
                    </div>
                    <span className="font-bold text-gray-300 group-hover:text-white">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-white mb-4"
              >
                <ChevronLeft className="w-4 h-4" /> Back to platforms
              </button>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Account ID</label>
                  <input
                    type="text"
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="e.g. act_123456789"
                    className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Access Token / API Key</label>
                  <input
                    type="password"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="shpat_..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-600/5 border border-indigo-500/20 flex gap-4">
                <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
                <p className="text-sm text-gray-400">
                  Your credentials are encrypted using industry-standard AES-256 and stored in the Atomized Vault.
                </p>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-5 rounded-[1.5rem] font-bold text-lg hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "Establish Connection"}
                {!submitting && <ArrowRight className="w-5 h-5 ml-1" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
