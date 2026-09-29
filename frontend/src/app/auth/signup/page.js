"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import AuthFooterNav from "@/components/auth/AuthFooterNav";
import HoneypotField from "@/components/auth/HoneypotField";
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import { AUTH_ROUTES, getPostAuthDestination } from "@/lib/auth/routes";
import { setAuthHandoff } from "@/lib/auth/handoff";
import { validateEmail, validatePassword, validatePasswordsMatch } from "@/lib/auth/validation";
import {
  isHoneypotTripped,
  triggerHoneypotLockout,
  isHoneypotLocked,
  HONEYPOT_BLOCKED_MESSAGE,
} from "@/lib/auth/honeypot";
import { isAuthenticated } from "@/lib/auth/session";
import { getSupabase } from "@/lib/supabase/client";

const CAPTCHA_REQUIRED_MESSAGE = "Please complete the security check.";

export default function SignupPage() {
  const router = useRouter();
  const turnstileRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState({ email: null, password: null });
  const [formError, setFormError] = useState(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  useEffect(() => {
    let cancelled = false;
    isAuthenticated().then((authed) => {
      if (!cancelled && authed) router.replace(getPostAuthDestination());
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isHoneypotLocked()) {
      setFormError(HONEYPOT_BLOCKED_MESSAGE);
      return;
    }
    if (isHoneypotTripped(honeypot)) {
      triggerHoneypotLockout();
      setFormError(HONEYPOT_BLOCKED_MESSAGE);
      return;
    }

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setFormError(null);
      return;
    }

    const mismatchError = validatePasswordsMatch(password, confirmPassword);
    if (mismatchError) {
      setErrors({ email: null, password: null });
      setFormError(mismatchError);
      return;
    }

    const captchaToken = turnstileRef.current?.getResponse();
    if (!captchaToken) {
      setFormError(CAPTCHA_REQUIRED_MESSAGE);
      return;
    }

    setErrors({ email: null, password: null });
    setFormError(null);

    const normalizedEmail = email.trim().toLowerCase();
    try {
      // Supabase doesn't reveal whether the email already has an account:
      // for an existing address it succeeds but sends no code.
      const { data, error } = await getSupabase().auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { name: name.trim() || "Learner" }, captchaToken },
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      // With "Confirm email" off in Supabase (see SHARING.md) the account is
      // signed in straight away and no code is sent.
      if (data.session) {
        router.push(getPostAuthDestination());
        return;
      }
      setAuthHandoff({ intent: "signup", email: normalizedEmail });
      router.push(AUTH_ROUTES.code);
    } finally {
      turnstileRef.current?.reset();
    }
  }

  return (
    <AuthCard>
      <AuthHeader title="Create your Gurukul account" />
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          id="name"
          name="name"
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
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
        <AuthInput
          id="password"
          name="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
          error={errors.password}
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
        <TurnstileWidget ref={turnstileRef} />
        <HoneypotField value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
        <AuthButton type="submit" className="w-full" disabled={!canSubmit}>
          Sign Up
        </AuthButton>
        <AuthError message={formError} />
      </form>
      <AuthFooterNav>
        <p>
          Already Have An Account?{" "}
          <Link href={AUTH_ROUTES.login} className="text-ochre underline underline-offset-4">
            Log in
          </Link>
        </p>
      </AuthFooterNav>
    </AuthCard>
  );
}
