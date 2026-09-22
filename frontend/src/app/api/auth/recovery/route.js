import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { issueOtp } from "@/lib/server/otp";
import { validateEmail } from "@/lib/auth/validation";

// Always returns success regardless of whether the account exists, to
// avoid leaking account existence via response differences — only issues
// an OTP when it actually does.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { email } = body;

  const emailError = validateEmail(email);
  if (emailError) {
    return Response.json({ error: emailError }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (user) {
    await issueOtp({ userId: user.id, email: normalizedEmail, intent: "recovery" });
  }

  return Response.json({ success: true });
}
