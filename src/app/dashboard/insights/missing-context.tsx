"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuickLogModal } from "@/components/quick-log-modal";
import { FormattedDate } from "@/components/ui/formatted-date";

interface ChangeEvent {
  id: string;
  source_platform: string;
  change_type: string;
  changed_fields: any;
  platform_event_timestamp: string;
  tenant_id: string;
  external_campaign_id: string | null;
}

export function MissingContextInbox() {
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ChangeEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadMissing = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Fetch events that don't have a linked decision log
    // In a real app, we'd use a join or a specific flag. 
    // For this prototype, we'll fetch recently detected events that don't have related_change_event_id pointing to them.
    
    const { data: eventsData } = await supabase
      .from("change_event_registry")
      .select("*")
      .order("platform_event_timestamp", { ascending: false })
      .limit(10);

    // We also need to know which events ARE linked.
    const eventIds = (eventsData as ChangeEvent[])?.map((e: ChangeEvent) => e.id) || [];
    const { data: linkedDecisions } = await supabase
      .from("optimization_log")
      .select("metadata");

    const linkedIds = new Set(
      (linkedDecisions || [])
        .map((d: any) => (d.metadata as any)?.related_event_id)
        .filter(Boolean)
    );
    const unlinked = (eventsData || []).filter((e: any) => !linkedIds.has(e.id));

    setEvents(unlinked);
    setLoading(false);
  };

  useEffect(() => {
    loadMissing();
  }, []);

  if (loading) return <div className="p-4 text-gray-500 animate-pulse text-sm">Scanning for operational gaps...</div>;

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
        <div className="text-2xl mb-2">✅</div>
        <h4 className="text-sm font-bold text-emerald-400">All Changes Accounted For</h4>
        <p className="text-xs text-gray-500 mt-1">Every material platform change has a strategic reason attached.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
          Missing Context Inbox
        </h3>
        <span className="text-[10px] text-gray-600 font-mono">{events.length} EXCEPTION(S)</span>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="group rounded-xl border border-gray-800 bg-gray-900/40 p-4 hover:border-amber-500/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                  {event.source_platform} &middot; {event.change_type.replace(/_/g, " ")}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Detected <FormattedDate date={event.platform_event_timestamp} mode="datetime" />
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedEvent(event);
                  setIsModalOpen(true);
                }}
                className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-[10px] font-bold text-amber-400 hover:bg-amber-500 hover:text-white transition-all shadow-lg shadow-amber-500/5"
              >
                Add Why
              </button>
            </div>
            
            <div className="bg-black/30 rounded-lg p-2.5 overflow-hidden">
               <pre className="text-[10px] text-gray-500 font-mono truncate">
                 {JSON.stringify(event.changed_fields)}
               </pre>
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <QuickLogModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            loadMissing();
          }}
          tenant_id={selectedEvent.tenant_id}
          campaignId={selectedEvent.external_campaign_id || undefined}
          relatedEventId={selectedEvent.id}
          initialTitle={`Reason for ${selectedEvent.change_type.replace(/_/g, " ")}`}
        />
      )}
    </div>
  );
}
