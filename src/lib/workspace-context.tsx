"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceContextType {
  workspace: Workspace | null;
  workspaces: Workspace[];
  setWorkspace: (ws: Workspace) => void;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  workspaces: [],
  setWorkspace: () => {},
  loading: true,
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspaces(id, name, slug)")
        .eq("user_id", user.id);

      const wsList =
        memberships
          ?.map((m) => m.workspaces as unknown as Workspace)
          .filter(Boolean) ?? [];

      setWorkspaces(wsList);

      // Restore from localStorage or pick first
      const savedId =
        typeof window !== "undefined"
          ? localStorage.getItem("atomized_workspace_id")
          : null;
      const saved = wsList.find((w) => w.id === savedId);
      if (saved) {
        setWorkspaceState(saved);
      } else if (wsList.length > 0) {
        setWorkspaceState(wsList[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  function setWorkspace(ws: Workspace) {
    setWorkspaceState(ws);
    if (typeof window !== "undefined") {
      localStorage.setItem("atomized_workspace_id", ws.id);
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{ workspace, workspaces, setWorkspace, loading }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
