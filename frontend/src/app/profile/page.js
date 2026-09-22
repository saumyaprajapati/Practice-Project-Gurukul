"use client";

import { useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import { validatePassword, validatePasswordsMatch } from "@/lib/auth/validation";
import { getCurrentUserProfile, updatePassword } from "@/lib/auth/profile";

// Name/Email are read-only (no edit controls, per Dashboard-3 scope); only
// the password fields are editable. Reuses the same Auth* form primitives
// the auth screens already use — no Hub-specific form components invented.
export default function ProfilePage() {
  const profile = getCurrentUserProfile();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ newPassword: null });
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    setSuccessMessage(null);

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
    updatePassword();
    setNewPassword("");
    setConfirmPassword("");
    setSuccessMessage("Password updated.");
  }

  return (
    <section className="section-manuscript flex flex-1 items-center justify-center px-4 py-16">
      <AuthCard className="max-w-md">
        <AuthHeader title="Profile" />

        <AuthInput id="name" name="name" label="Name" value={profile.name} disabled />
        <AuthInput
          id="email"
          name="email"
          label="Email"
          type="email"
          value={profile.email}
          disabled
        />

        <h2 className="mt-6 mb-4 font-semibold text-charcoal">Password</h2>
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
            Update Password
          </AuthButton>
          <AuthError message={formError} />
          {successMessage ? (
            <p role="status" aria-live="polite" className="mt-4 text-sm text-charcoal/80">
              {successMessage}
            </p>
          ) : null}
        </form>
      </AuthCard>
    </section>
  );
}
