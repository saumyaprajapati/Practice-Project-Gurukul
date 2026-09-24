"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import { validatePassword, validatePasswordsMatch } from "@/lib/auth/validation";
import { getCurrentUserProfile, updatePassword, becomeInstructor } from "@/lib/auth/profile";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// Name/Email are read-only (no edit controls, per Dashboard-3 scope); only
// the password fields are editable. Reuses the same Auth* form primitives
// the auth screens already use — no Hub-specific form components invented.
export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ newPassword: null });
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isBecomingInstructor, setIsBecomingInstructor] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserProfile().then((data) => {
      if (!cancelled) setProfile(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
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

    const result = await updatePassword(currentPassword, newPassword, confirmPassword);
    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccessMessage("Password updated.");
  }

  async function handleBecomeInstructor() {
    setIsBecomingInstructor(true);
    await becomeInstructor();
    setProfile((prev) => ({ ...prev, isInstructor: true }));
  }

  if (!profile) return null;

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

        <h2 className="mt-6 mb-4 font-semibold text-charcoal">Teaching</h2>
        {profile.isInstructor ? (
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href={GURUKUL_ROUTES.myCourses} className="underline underline-offset-4">
              My Courses
            </Link>
            <Link href={GURUKUL_ROUTES.createCourse} className="underline underline-offset-4">
              Create a Course
            </Link>
            {profile.isAdmin ? (
              <Link href={GURUKUL_ROUTES.adminCourses} className="underline underline-offset-4">
                Admin
              </Link>
            ) : null}
          </div>
        ) : (
          <AuthButton
            type="button"
            variant="secondary"
            onClick={handleBecomeInstructor}
            disabled={isBecomingInstructor}
          >
            Become an Instructor
          </AuthButton>
        )}

        <h2 className="mt-6 mb-4 font-semibold text-charcoal">Password</h2>
        <form onSubmit={handleSubmit} noValidate>
          <AuthInput
            id="currentPassword"
            name="currentPassword"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
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
