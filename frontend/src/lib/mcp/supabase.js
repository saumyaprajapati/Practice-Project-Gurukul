import "server-only";
import { createClient } from "@supabase/supabase-js";

// Supabase client for one MCP request, acting as the user the agent's OAuth
// token belongs to — same publishable key and RLS as the browser client.
// Never the secret key: the MCP server can do exactly what the user can.
export function supabaseForToken(accessToken) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// Issuer of the tokens: Supabase Auth's OAuth 2.1 server.
export function authServerUrl() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`;
}
