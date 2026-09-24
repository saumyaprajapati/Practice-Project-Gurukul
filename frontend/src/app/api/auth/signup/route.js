import bcrypt from "bcryptjs";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { validateEmail, validatePassword, validatePasswordsMatch } from "@/lib/auth/validation";
import { isHoneypotTripped, HONEYPOT_BLOCKED_MESSAGE } from "@/lib/auth/honeypot";
import { issueOtp } from "@/lib/server/otp";

const BCRYPT_ROUNDS = 10;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { name, email, password, confirmPassword, honeypot } = body;

  if (isHoneypotTripped(honeypot)) {
    return Response.json({ error: HONEYPOT_BLOCKED_MESSAGE }, { status: 400 });
  }

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError || passwordError) {
    return Response.json({ error: emailError ?? passwordError }, { status: 400 });
  }

  const mismatchError = validatePasswordsMatch(password, confirmPassword);
  if (mismatchError) {
    return Response.json({ error: mismatchError }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return Response.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const { data: user, error: insertError } = await supabase
    .from("users")
    .insert({ name: name?.trim() || "Learner", email: normalizedEmail, password_hash: passwordHash })
    .select("id")
    .single();

  if (insertError) {
    return Response.json({ error: "Could not create account. Please try again." }, { status: 500 });
  }

  await issueOtp({ userId: user.id, email: normalizedEmail, intent: "signup" });

  return Response.json({ success: true });
}
