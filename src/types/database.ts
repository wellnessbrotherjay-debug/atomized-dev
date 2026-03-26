export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LayerType = "media" | "digital" | "business";
export type ChangeCategory =
  | "budget"
  | "creative"
  | "targeting"
  | "bidding"
  | "audience"
  | "other";
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          slug: string;
          industry: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          slug: string;
          industry?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          slug?: string;
          industry?: string | null;
          website?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          status: string;
          platform: string | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          status?: string;
          platform?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          status?: string;
          platform?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      metrics: {
        Row: {
          id: string;
          client_id: string;
          campaign_id: string | null;
          layer_type: LayerType;
          metric_name: string;
          metric_value: number;
          period_start: string;
          period_end: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          campaign_id?: string | null;
          layer_type: LayerType;
          metric_name: string;
          metric_value: number;
          period_start: string;
          period_end: string;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          campaign_id?: string | null;
          layer_type?: LayerType;
          metric_name?: string;
          metric_value?: number;
          period_start?: string;
          period_end?: string;
          source?: string | null;
        };
        Relationships: [];
      };
      change_log: {
        Row: {
          id: string;
          client_id: string;
          campaign_id: string | null;
          category: ChangeCategory;
          description: string;
          changed_at: string;
          changed_by: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          campaign_id?: string | null;
          category: ChangeCategory;
          description: string;
          changed_at: string;
          changed_by?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          campaign_id?: string | null;
          category?: ChangeCategory;
          description?: string;
          changed_at?: string;
          changed_by?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      user_workspace_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: {
      layer_type: LayerType;
      change_category: ChangeCategory;
      workspace_role: WorkspaceRole;
    };
  };
}
