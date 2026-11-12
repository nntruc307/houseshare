import { createClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/server";

// Always run at request time: the point is to reach the database on every call.
export const dynamic = "force-dynamic";

/**
 * Called twice a week by .github/workflows/keepalive.yml so the Supabase
 * free-tier project is not paused for inactivity. Public, returns no data:
 * it queries as an anonymous caller, and RLS gives anonymous callers no rows.
 */
export async function GET() {
  const supabase = createClient(supabaseUrl(), supabasePublishableKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.from("rooms").select("id").limit(1);

  // "permission denied" (42501) still means the query reached Postgres.
  const ok = !error || error.code === "42501";
  return Response.json(
    { ok },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
