import "server-only";
import { cookies } from "next/headers";
import { verifyToken } from "./jwt";

export const SESSION_COOKIE = "gurukul_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export async function setSessionCookie(token) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Reads and verifies the session cookie, returning { userId } or null.
// Every protected route handler must call this first and 401 if it
// returns null — there is no database-level (RLS) backstop, since the
// Supabase client used server-side runs with the secret key (see
// lib/server/supabaseClient.js).
export async function getAuthenticatedUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token, "session");
  if (!payload) return null;

  return { userId: payload.sub };
}
