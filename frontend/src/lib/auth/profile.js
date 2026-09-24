// Current user's profile (Supabase Auth user + public.profiles row) and the
// self-service account actions. Roles are only ever changed server-side:
// become_instructor is an RPC, is_admin is set by hand in the SQL editor.
import { getSupabase } from "@/lib/supabase/client";
import { ApiError, unwrap } from "@/lib/supabase/errors";
import { validatePassword, validatePasswordsMatch } from "@/lib/auth/validation";

export async function getCurrentUserProfile() {
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new ApiError("Not authenticated.", 401);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name, is_instructor, is_admin")
    .eq("id", auth.user.id)
    .single();
  if (error) throw new ApiError("Profile not found.", 404);

  return {
    id: auth.user.id,
    name: profile.name,
    email: auth.user.email,
    isInstructor: profile.is_instructor,
    isAdmin: profile.is_admin,
  };
}

export async function becomeInstructor() {
  unwrap(await getSupabase().rpc("become_instructor"));
}

// captchaToken is new: re-checking the current password is a sign-in, which
// Turnstile protects.
export async function updatePassword(currentPassword, newPassword, confirmNewPassword, captchaToken) {
  const passwordError = validatePassword(newPassword);
  if (passwordError) return { success: false, error: passwordError };
  const mismatchError = validatePasswordsMatch(newPassword, confirmNewPassword);
  if (mismatchError) return { success: false, error: mismatchError };

  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { success: false, error: "Not authenticated." };

  const { error: checkError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: currentPassword ?? "",
    options: { captchaToken },
  });
  if (checkError) return { success: false, error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? { success: false, error: error.message } : { success: true };
}
