import bcrypt from "bcryptjs";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { verifyToken } from "@/lib/server/jwt";
import { validatePassword, validatePasswordsMatch } from "@/lib/auth/validation";

const BCRYPT_ROUNDS = 10;

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { resetToken, newPassword, confirmNewPassword } = body;

  const payload = resetToken ? verifyToken(resetToken, "password_reset") : null;
  if (!payload) {
    return Response.json({ error: "This reset link has expired. Please start again." }, { status: 401 });
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }

  const mismatchError = validatePasswordsMatch(newPassword, confirmNewPassword);
  if (mismatchError) {
    return Response.json({ error: mismatchError }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const supabase = getSupabaseClient();
  await supabase
    .from("users")
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq("id", payload.sub);

  return Response.json({ success: true });
}
