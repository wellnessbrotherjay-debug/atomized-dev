import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { mockSupabaseClient } from "./mock-client";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !url.startsWith("http") || !anonKey || anonKey.includes("your-supabase-anon-key")) {
    return mockSupabaseClient as any;
  }

  return createBrowserClient<Database>(url, anonKey);
}

export function createSecondaryClient() {
  const url = process.env.NEXT_PUBLIC_SECONDARY_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SECONDARY_SUPABASE_ANON_KEY;

  if (!url || !url.startsWith("http") || !anonKey) {
    return mockSupabaseClient as any;
  }

  return createBrowserClient<Database>(url, anonKey);
}

