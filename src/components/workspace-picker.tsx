"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";

export function WorkspacePicker() {
  const { workspaces, setWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toSlug(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    const slug = toSlug(name);
    if (!slug) {
      setError("Please enter a valid name.");
      setCreating(false);
      return;
    }

    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("workspaces")
      .insert({ name, slug })
      .select()
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setWorkspace({ id: data.id, name: data.name, slug: data.slug });
      window.location.reload();
    }
    setCreating(false);
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md px-6 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Get Started</h2>
          <p className="text-gray-400 mt-2">
            {workspaces.length > 0
              ? "Select a workspace or create a new one."
              : "Create your first workspace to begin."}
          </p>
        </div>

        {workspaces.length > 0 && (
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setWorkspace(ws)}
                className="w-full text-left rounded-lg border border-gray-800 p-4 hover:border-gray-600 transition-colors"
              >
                <p className="font-medium">{ws.name}</p>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New workspace name"
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {creating ? "..." : "Create"}
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}
