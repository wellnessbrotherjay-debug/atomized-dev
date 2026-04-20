import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { mockSupabaseClient } from "./mock-client";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith("http") || !anonKey || anonKey.includes("your-supabase-anon-key")) {
    return mockSupabaseClient as any;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    serviceRoleKey || anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if middleware refreshes sessions.
          }
        },
      },
    }
  );
}

export async function createSecondaryClient() {
  const url = process.env.NEXT_PUBLIC_SECONDARY_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SECONDARY_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SECONDARY_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith("http") || !anonKey) {
    return mockSupabaseClient as any;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    serviceRoleKey || anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if middleware refreshes sessions.
          }
        },
      },
    }
  );
}
