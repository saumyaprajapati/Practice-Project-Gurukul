import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { consumeOtp } from "@/lib/server/otp";
import { signSessionToken, signResetToken } from "@/lib/server/jwt";
import { setSessionCookie } from "@/lib/server/auth";
import { validateCode } from "@/lib/auth/validation";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { email, code, intent } = body;

  if (!email || (intent !== "signup" && intent !== "recovery")) {
    return Response.json({ error: "Incorrect Code Enterred" }, { status: 400 });
  }

  const codeError = validateCode(code);
  if (codeError) {
    return Response.json({ error: "Incorrect Code Enterred" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const result = await consumeOtp({ email: normalizedEmail, intent, code });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  if (intent === "signup") {
    const supabase = getSupabaseClient();
    await supabase
      .from("users")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("id", result.userId);

    const token = signSessionToken(result.userId);
    await setSessionCookie(token);
    return Response.json({ success: true });
  }

  // Recovery: don't log the user in — hand back a short-lived reset token
  // for the very next step (set a new password) instead.
  const resetToken = signResetToken(result.userId);
  return Response.json({ success: true, resetToken });
}
