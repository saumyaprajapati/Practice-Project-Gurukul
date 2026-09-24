"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import AuthFooterNav from "@/components/auth/AuthFooterNav";
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { setAuthHandoff } from "@/lib/auth/handoff";
import { validateEmail } from "@/lib/auth/validation";
import { getSupabase } from "@/lib/supabase/client";

export default function RecoveryPage() {
  const router = useRouter();
  const turnstileRef = useRef(null);
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

    const captchaToken = turnstileRef.current?.getResponse();
    if (!captchaToken) {
      setFormError("Please complete the security check.");
      return;
    }

    setErrors({ email: null });
    setFormError(null);

    const normalizedEmail = email.trim().toLowerCase();
    try {
      // Always continues to the code screen, whether or not the account
      // exists — the response never reveals which emails are registered.
      const { error } = await getSupabase().auth.resetPasswordForEmail(normalizedEmail, { captchaToken });
      if (error && (error.code === "over_email_send_rate_limit" || error.status === 429)) {
        setFormError("Too many attempts. Please try again later.");
        return;
      }
      setAuthHandoff({ intent: "recovery", email: normalizedEmail });
      router.push(AUTH_ROUTES.code);
    } finally {
      turnstileRef.current?.reset();
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
        <TurnstileWidget ref={turnstileRef} />
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
