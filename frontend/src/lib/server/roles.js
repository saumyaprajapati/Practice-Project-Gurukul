import "server-only";
import { getSupabaseClient } from "./supabaseClient";

// Shared role lookup for every route that needs an is_instructor/is_admin
// check — there's no RLS backstop (see supabaseClient.js), so every route
// gating on a role calls this itself rather than trusting the client.
export async function getUserRoles(userId) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("is_instructor, is_admin")
    .eq("id", userId)
    .maybeSingle();

  return {
    isInstructor: data?.is_instructor ?? false,
    isAdmin: data?.is_admin ?? false,
  };
}
