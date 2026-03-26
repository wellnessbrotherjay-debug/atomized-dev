import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { WorkspaceProvider } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        <Sidebar userEmail={user.email ?? ""} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </WorkspaceProvider>
  );
}
