import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client, using the secret (service_role) key — it
// bypasses Row Level Security entirely. Since this app uses custom JWT
// auth (not Supabase Auth), RLS never applies to these users anyway: every
// route handler is individually responsible for scoping its own queries to
// the authenticated user's id (see lib/server/auth.js). The `server-only`
// import makes it a build error if this ever gets pulled into client code.
let client = null;

export function getSupabaseClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables.");
    }
    client = createClient(url, key);
  }
  return client;
}
