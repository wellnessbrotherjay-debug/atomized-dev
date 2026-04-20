"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { WorkspacePicker } from "@/components/workspace-picker";

interface Task {
  id: string;
  title: string;
  status: string;
  owner: string;
  due_date: string;
}

const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Completed" },
];

export default function TasksPage() {
  const { workspace, loading: wsLoading } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      const supabase = createClient();
      // project_tasks table might need tenant_id rename later, but for now we align the filter
      const { data } = await supabase.from("project_tasks").select("*").eq("tenant_id", selectedTenant);
      setTasks(data || []);
      setLoading(false);
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
            Strategic Action Items
          </h1>
          <p className="text-gray-400 mt-2">Fulfillment tasks and operational launch blockers.</p>
        </div>
        
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select Tenant...</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {!selectedTenant ? (
        <div className="h-64 rounded-2xl border border-gray-800 border-dashed flex items-center justify-center text-gray-500">
           Select a tenant to view the task board
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{col.label}</h3>
                <span className="text-[10px] bg-gray-800 text-gray-600 px-2 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              
              <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900/10 p-4 space-y-4">
                 {tasks.filter(t => t.status === col.id).map(task => (
                   <div key={task.id} className="group rounded-xl border border-gray-800 bg-gray-900/40 p-5 hover:border-gray-700 transition-all cursor-grab active:cursor-grabbing">
                      <h4 className="text-sm font-bold text-white mb-3 leading-snug">{task.title}</h4>
                      <div className="flex items-center justify-between mt-4">
                         <div className="flex -space-x-1">
                            <div className="w-5 h-5 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[8px] font-bold text-gray-400">JG</div>
                         </div>
                         <div className="text-[9px] font-bold text-gray-600 uppercase">
                            Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'TBD'}
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 <button className="w-full py-3 rounded-xl border border-gray-800 border-dashed text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-900/50 hover:text-gray-400 transition-all">
                   + Add Task
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

