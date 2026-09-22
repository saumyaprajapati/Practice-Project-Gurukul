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
import { apiFetch } from "@/lib/apiClient";

const RESET_TOKEN_KEY = "gurukul.auth.resetToken";

// The final step of the recovery flow — set a new password using the
// short-lived reset token issued by /auth/code after a successful
// recovery OTP verification. There was no such step in the mock version
// (successful code entry used to just log the user in directly).
export default function ResetPasswordPage() {
  const router = useRouter();
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ newPassword: null });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage can't be read during SSR; this must run post-mount to avoid a hydration mismatch.
      setResetToken(sessionStorage.getItem(RESET_TOKEN_KEY) ?? "");
    } catch {
      setResetToken("");
    }
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

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: { resetToken, newPassword, confirmNewPassword: confirmPassword },
      });
      try {
        sessionStorage.removeItem(RESET_TOKEN_KEY);
      } catch {
        // Nothing to clear.
      }
      router.push(AUTH_ROUTES.login);
    } catch (error) {
      setFormError(error.message);
    }
  }

  if (resetToken === null) return null;

  if (!resetToken) {
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
