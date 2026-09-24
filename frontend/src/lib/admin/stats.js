import { getSupabase } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/errors";

// Dashboard counts — see admin_stats() in supabase/phase6-admin.sql for keys.
export async function getAdminStats() {
  return unwrap(await getSupabase().rpc("admin_stats"));
}
