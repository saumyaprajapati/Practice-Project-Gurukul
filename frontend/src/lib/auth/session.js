import { apiFetch } from "@/lib/apiClient";

// Real authenticated-session check, backed by the httpOnly session cookie
// the server sets/clears — isolated behind these functions the same way
// the mock version was, so call sites (guard.js, the landing header,
// Login/Signup's "already authenticated" redirect) barely changed shape,
// just became async.
export async function getSession() {
  try {
    const data = await apiFetch("/api/auth/me");
    return data.authenticated ? data.user : null;
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  return Boolean(await getSession());
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Best-effort — the client-side redirect after calling this happens
    // regardless.
  }
}
