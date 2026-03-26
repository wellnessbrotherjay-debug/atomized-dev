"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewWorkspacePage() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function toSlug(s: string) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const slug = toSlug(name);
    if (!slug) {
      setError("Please enter a valid workspace name.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("workspaces")
      .insert({ name, slug });

    if (error) {
      setError(error.message);
    } else {
      router.push(`/dashboard/${slug}`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-sm space-y-6 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Workspace</h1>
          <p className="mt-2 text-gray-400">
            A workspace groups your agency&apos;s clients and team members.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Workspace Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Acme Agency"
            />
            {name && (
              <p className="mt-1 text-xs text-gray-500">
                Slug: {toSlug(name) || "—"}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 py-2 font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Workspace"}
          </button>
        </form>

        <p className="text-center">
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-white">
            &larr; Back to dashboard
          </a>
        </p>
      </div>
    </main>
  );
}
