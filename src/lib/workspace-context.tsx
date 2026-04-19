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

      // Try to load workspaces (works with or without auth)
      const { data: allWorkspaces } = await supabase
        .from("workspaces")
        .select("id, name, slug");

      const wsList = (allWorkspaces ?? []) as Workspace[];
      setWorkspaces(wsList);

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
