import "server-only";
import { getSupabaseClient } from "./supabaseClient";

const OTP_EXPIRES_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

// Idempotent, mirroring the mock's issueVerificationCode(): reuses an
// existing unconsumed, unexpired code for this (email, intent) instead of
// issuing a new one each time the code screen mounts.
export async function issueOtp({ userId = null, email, intent }) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("otp_codes")
    .select("code")
    .eq("email", email)
    .eq("intent", intent)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // No real email backend yet — surface the code server-side only.
    console.info(`[auth/otp] ${intent} code for ${email}: ${existing.code}`);
    return existing.code;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MS).toISOString();

  await supabase.from("otp_codes").insert({ user_id: userId, email, code, intent, expires_at: expiresAt });

  console.info(`[auth/otp] ${intent} code for ${email}: ${code}`);
  return code;
}

// Exact wording required by the auth contract — do not "fix" the typo.
export const INCORRECT_CODE_MESSAGE = "Incorrect Code Enterred";

// Returns { ok: true, userId } on success, or { ok: false, error } on
// failure (wrong code, expired, or no pending code at all).
export async function consumeOtp({ email, intent, code }) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data: pending } = await supabase
    .from("otp_codes")
    .select("id, user_id, code, attempts")
    .eq("email", email)
    .eq("intent", intent)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pending) {
    return { ok: false, error: INCORRECT_CODE_MESSAGE };
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Please request a new code." };
  }

  if (pending.code !== code) {
    await supabase
      .from("otp_codes")
      .update({ attempts: pending.attempts + 1 })
      .eq("id", pending.id);
    return { ok: false, error: INCORRECT_CODE_MESSAGE };
  }

  await supabase.from("otp_codes").update({ consumed_at: now }).eq("id", pending.id);
  return { ok: true, userId: pending.user_id };
}
