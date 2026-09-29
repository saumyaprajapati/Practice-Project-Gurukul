"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import AuthFooterNav from "@/components/auth/AuthFooterNav";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { validatePassword, validatePasswordsMatch } from "@/lib/auth/validation";
import { getSupabase } from "@/lib/supabase/client";

// The final step of the recovery flow. Verifying the recovery code on
// /auth/code signs the user in, so the new password is set with
// updateUser() on that session; the user is then signed out and sent to
// log in with the new password (same behaviour as before).
export default function ResetPasswordPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ newPassword: null });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) setHasSession(Boolean(data?.user));
      })
      .catch(() => {
        if (!cancelled) setHasSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      setFormError(null);
      return;
    }

    const mismatchError = validatePasswordsMatch(newPassword, confirmPassword);
    if (mismatchError) {
      setErrors({ newPassword: null });
      setFormError(mismatchError);
      return;
    }

    setErrors({ newPassword: null });
    setFormError(null);

    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setFormError(error.message);
      return;
    }
    await supabase.auth.signOut();
    router.push(AUTH_ROUTES.login);
  }

  if (hasSession === null) return null;

  if (!hasSession) {
    return (
      <AuthCard>
        <AuthHeader title="Reset Password" />
        <p className="text-charcoal/80">
          This reset link has expired. Please start password recovery again.
        </p>
        <AuthFooterNav>
          <p>
            <Link href={AUTH_ROUTES.recovery} className="text-ochre underline underline-offset-4">
              Back to password recovery
            </Link>
          </p>
        </AuthFooterNav>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader title="Set a New Password" />
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          id="newPassword"
          name="newPassword"
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          autoComplete="new-password"
          error={errors.newPassword}
        />
        <AuthInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          autoComplete="new-password"
        />
        <AuthButton type="submit" className="w-full">
          Set Password
        </AuthButton>
        <AuthError message={formError} />
      </form>
    </AuthCard>
  );
}
