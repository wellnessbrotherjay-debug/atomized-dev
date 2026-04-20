"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenant_id: string;
  campaignId?: string;
  relatedEventId?: string;
  initialTitle?: string;
}

export function QuickLogModal({
  isOpen,
  onClose,
  onSuccess,
  tenant_id,
  campaignId,
  relatedEventId,
  initialTitle = ""
}: QuickLogModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [reason, setReason] = useState("");
  const [type, setType] = useState("optimization");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await supabase.from("optimization_log").insert({
      tenant_id,
      campaign_id: campaignId || null,
      change_type: type,
      description: reason,
      effective_date: new Date().toISOString().split('T')[0],
      metadata: {
        title: title,
        related_event_id: relatedEventId || null
      }
    });

    if (!error) {
      onSuccess();
      onClose();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h3 className="text-xl font-bold text-white">Quick Log Reason</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Context Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="client_request">Client Request</option>
              <option value="optimization">Optimization</option>
              <option value="creative_refresh">Creative Refresh</option>
              <option value="budget_shift">Budget Shift</option>
              <option value="tracking_issue">Tracking Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Decision Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summary of decision..."
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Reason (The "Why")</label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why was this change made? What was the hypothesis?"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-700 px-6 py-4 font-bold text-gray-400 hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Context"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
