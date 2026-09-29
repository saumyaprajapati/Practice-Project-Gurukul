import { getSupabase } from "@/lib/supabase/client";

// Supabase Auth session check — isolated behind the same three functions as
// before, so call sites (guard.js, the landing header, Login/Signup's
// "already authenticated" redirect) didn't change. getUser() validates the
// session with Supabase Auth rather than trusting the local cookie alone.
export async function getSession() {
  try {
    const { data } = await getSupabase().auth.getUser();
    const user = data?.user;
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.user_metadata?.name ?? "Learner" };
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  return Boolean(await getSession());
}

export async function logout() {
  try {
    await getSupabase().auth.signOut();
  } catch {
    // Best-effort — the client-side redirect after calling this happens
    // regardless.
  }
}
