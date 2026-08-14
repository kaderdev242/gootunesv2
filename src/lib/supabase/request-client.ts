import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createClient as createCookieClient } from "@/lib/supabase/server";

/**
 * Client Supabase pour les Route Handlers.
 * Priorité : Bearer (app mobile) → cookies (web).
 */
export async function createRequestClient(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return createSupabaseJsClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: auth } },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return createCookieClient();
}
