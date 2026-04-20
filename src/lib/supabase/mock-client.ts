/**
 * A mock Supabase client fallback for local development when keys are missing.
 * Returns empty data or sample sets to prevent the application from crashing.
 */

const createMockProxy = (data: any = []) => {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve({ data, error: null, count: data.length });
      }
      
      // Handle the common builder patterns
      if (["select", "from", "eq", "order", "limit", "single", "insert", "update", "delete", "upsert", "head"].includes(prop as string)) {
        return () => new Proxy({}, handler);
      }

      // Handle auth methods
      if (prop === "auth") {
        return {
          getUser: async () => ({ data: { user: null }, error: null }),
          getSession: async () => ({ data: { session: null }, error: null }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        };
      }

      return () => new Proxy({}, handler);
    },
  };

  return new Proxy({}, handler);
};

export const mockSupabaseClient = createMockProxy([
  { id: "1", name: "Sample Workspace", slug: "sample" }
]);

export function isMockClient(client: any): boolean {
  return client === mockSupabaseClient;
}
