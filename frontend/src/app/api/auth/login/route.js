import bcrypt from "bcryptjs";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { signSessionToken } from "@/lib/server/jwt";
import { setSessionCookie } from "@/lib/server/auth";
import { validateEmail, validatePassword } from "@/lib/auth/validation";
import { isHoneypotTripped, HONEYPOT_BLOCKED_MESSAGE } from "@/lib/auth/honeypot";

const GENERIC_ERROR = "Invalid email or password.";
const MAX_ATTEMPTS_PER_WINDOW = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { email, password, honeypot } = body;

  if (isHoneypotTripped(honeypot)) {
    return Response.json({ error: HONEYPOT_BLOCKED_MESSAGE }, { status: 400 });
  }

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError || passwordError) {
    return Response.json({ error: emailError ?? passwordError }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();

  // Minimal, DB-backed rate limiting — not production-grade, just enough
  // to slow down naive brute forcing (see plan's "guardrails").
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count: recentAttempts } = await supabase
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", normalizedEmail)
    .gt("attempted_at", windowStart);

  if ((recentAttempts ?? 0) >= MAX_ATTEMPTS_PER_WINDOW) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  await supabase.from("login_attempts").insert({ email: normalizedEmail });

  const { data: user } = await supabase
    .from("users")
    .select("id, password_hash, email_verified_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!user || !user.email_verified_at) {
    return Response.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return Response.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = signSessionToken(user.id);
  await setSessionCookie(token);

  return Response.json({ success: true });
}
