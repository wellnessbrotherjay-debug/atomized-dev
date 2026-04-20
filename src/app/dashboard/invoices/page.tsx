"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  invoice_date: string;
}

export default function InvoicesPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (wsLoading || !workspace) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("tenants").select("id, name").order("name");
      setTenants(data || []);
    }
    load();
  }, [workspace, wsLoading]);

  useEffect(() => {
    if (!selectedTenant) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("invoices").select("*").eq("tenant_id", selectedTenant);
      setInvoices(data || []);
    }
    load();
  }, [selectedTenant]);

  if (wsLoading) return <div className="p-10 text-gray-500">Loading...</div>;
  if (!workspace) return <WorkspacePicker />;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Financial Audit
          </h1>
          <p className="text-gray-400 mt-2">Track media plan allocation vs. actual invoiced spend.</p>
        </div>
        
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Select Tenant...</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {!selectedTenant ? (
        <div className="h-64 rounded-2xl border border-gray-800 border-dashed flex items-center justify-center text-gray-500">
           Select a tenant to view financial reconciliation
        </div>
      ) : (
        <div className="space-y-10">
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Approved Media Plan</p>
              <p className="text-2xl font-bold text-white">$27,000.00</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Invoiced</p>
              <p className="text-2xl font-bold text-white">
                ${invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-emerald-500/5 p-6 border-emerald-500/10">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Budget Variance</p>
              <p className="text-2xl font-bold text-emerald-400">+$2,450.00</p>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/20 overflow-hidden">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-gray-800 bg-gray-900/50">
                   <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Invoice #</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-800/50">
                 {invoices.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm italic">
                       No invoices recorded for this period.
                     </td>
                   </tr>
                 ) : (
                   invoices.map(inv => (
                     <tr key={inv.id} className="hover:bg-gray-800/20 transition-all">
                       <td className="px-6 py-6 font-mono text-sm text-white">{inv.invoice_number}</td>
                       <td className="px-6 py-6 text-sm text-gray-400">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                       <td className="px-6 py-6 text-sm font-bold text-white">${inv.amount?.toLocaleString()}</td>
                       <td className="px-6 py-6 font-mono text-sm text-white">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {inv.status}
                          </span>
                       </td>
                       <td className="px-6 py-6 text-right">
                          <button className="text-[10px] font-bold text-gray-500 hover:text-white transition-all uppercase tracking-widest">View PDF</button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
}
