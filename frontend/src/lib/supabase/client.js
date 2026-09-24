import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client, using the publishable key — every query runs as
// the signed-in user, so RLS (supabase/phase5b-baas.sql) decides what it can
// read or write. createBrowserClient returns the same instance on every call
// in the browser, so calling this repeatedly is fine.
export function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
