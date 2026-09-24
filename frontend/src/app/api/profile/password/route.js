import bcrypt from "bcryptjs";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { validatePassword, validatePasswordsMatch } from "@/lib/auth/validation";

const BCRYPT_ROUNDS = 10;

export async function PATCH(request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { currentPassword, newPassword, confirmNewPassword } = body;

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }

  const mismatchError = validatePasswordsMatch(newPassword, confirmNewPassword);
  if (mismatchError) {
    return Response.json({ error: mismatchError }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", session.userId)
    .maybeSingle();

  if (!user) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const currentMatches = await bcrypt.compare(currentPassword ?? "", user.password_hash);
  if (!currentMatches) {
    return Response.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await supabase
    .from("users")
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq("id", session.userId);

  return Response.json({ success: true });
}
