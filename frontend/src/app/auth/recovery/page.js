"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import AuthFooterNav from "@/components/auth/AuthFooterNav";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { setAuthHandoff } from "@/lib/auth/handoff";
import { validateEmail } from "@/lib/auth/validation";
import { apiFetch } from "@/lib/apiClient";

export default function RecoveryPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({ email: null });
  const [formError, setFormError] = useState(null);

  const canSubmit = email.trim().length > 0;

  async function handleSubmit(event) {
    event.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setErrors({ email: null });
    setFormError(null);

    try {
      await apiFetch("/api/auth/recovery", { method: "POST", body: { email } });
      setAuthHandoff({ intent: "recovery", email });
      router.push(AUTH_ROUTES.code);
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Recover Password"
        subtitle="Enter your email and we'll send a verification code."
      />
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          id="email"
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          error={errors.email}
        />
        <AuthButton type="submit" className="w-full" disabled={!canSubmit}>
          Continue
        </AuthButton>
        <AuthError message={formError} />
      </form>
      <AuthFooterNav>
        <p>
          Remembered your password?{" "}
          <Link href={AUTH_ROUTES.login} className="text-ochre underline underline-offset-4">
            Log in
          </Link>
        </p>
      </AuthFooterNav>
    </AuthCard>
  );
}
