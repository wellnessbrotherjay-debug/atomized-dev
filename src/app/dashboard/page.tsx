import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's workspaces
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, slug)")
    .eq("user_id", user.id);

  const workspaces =
    memberships?.map((m) => ({
      ...(m.workspaces as unknown as { id: string; name: string; slug: string }),
      role: m.role,
    })) ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Atomized</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Workspaces</h2>
          <a
            href="/dashboard/new-workspace"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            New Workspace
          </a>
        </div>

        {workspaces.length === 0 ? (
          <div className="rounded-lg border border-gray-800 p-10 text-center">
            <p className="text-gray-400 mb-4">
              You don&apos;t have any workspaces yet. Create one to get started.
            </p>
            <a
              href="/dashboard/new-workspace"
              className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              Create Your First Workspace
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {workspaces.map((ws) => (
              <a
                key={ws.id}
                href={`/dashboard/${ws.slug}`}
                className="block rounded-lg border border-gray-800 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{ws.name}</h3>
                  <span className="text-xs rounded-full bg-gray-800 px-2 py-1 text-gray-400 capitalize">
                    {ws.role}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
