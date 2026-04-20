"use client";

import { useEffect, useState } from "react";
import { 
  Check, 
  Search, 
  Loader2, 
  AlertCircle,
  Building2,
  X 
} from "lucide-react";

interface Account {
  id: string;
  descriptive_name: string;
}

interface AccountSelectorModalProps {
  connectionId: string;
  sourceType: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AccountSelectorModal({ connectionId, sourceType, onClose, onSuccess }: AccountSelectorModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/ingestion/connections/${connectionId}/discover`);
        if (!res.ok) throw new Error("Failed to discover accounts");
        const data = await res.json();
        setAccounts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAccounts();
  }, [connectionId, BACKEND_URL]);

  const handleSelect = async () => {
    if (!selectedId) return;
    setSaving(true);
    
    const selectedAccount = accounts.find(a => a.id === selectedId);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/ingestion/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          external_account_id: selectedId,
          account_label: selectedAccount?.descriptive_name || "Linked Account",
          status: "active"
        }),
      });
      
      if (!res.ok) throw new Error("Failed to save selection");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredAccounts = accounts.filter(a => 
    a.descriptive_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-gray-950 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Select {sourceType === 'google_ads' ? 'Google Ads Account' : 'GA4 Property'}</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Account Discovery</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-gray-400 animate-pulse">Scanning available accounts...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-400 font-medium">{error}</p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-gray-800 rounded-xl text-sm font-bold"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search by name or ID..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedId(account.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                      selectedId === account.id 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-gray-800 bg-gray-900/30 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className={`w-5 h-5 ${selectedId === account.id ? 'text-indigo-400' : 'text-gray-500'}`} />
                      <div>
                        <p className="font-bold text-sm text-gray-200">{account.descriptive_name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">ID: {account.id}</p>
                      </div>
                    </div>
                    {selectedId === account.id && <Check className="w-5 h-5 text-indigo-400" />}
                  </button>
                ))}
                {filteredAccounts.length === 0 && (
                  <p className="text-center py-10 text-gray-500 text-sm">No accounts found.</p>
                )}
              </div>

              <button
                disabled={!selectedId || saving}
                onClick={handleSelect}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Link Selected Account"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
