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
import { validateEmail, validatePassword } from "@/lib/auth/validation";
import {
  isHoneypotTripped,
  triggerHoneypotLockout,
  isHoneypotLocked,
  HONEYPOT_BLOCKED_MESSAGE,
} from "@/lib/auth/honeypot";
import { isAuthenticated } from "@/lib/auth/session";
import { getSupabase } from "@/lib/supabase/client";

const GENERIC_ERROR = "Invalid email or password.";
const CAPTCHA_REQUIRED_MESSAGE = "Please complete the security check.";

export default function LoginPage() {
  const router = useRouter();
  const turnstileRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const captchaToken = turnstileRef.current?.getResponse();
    if (!captchaToken) {
      setFormError(CAPTCHA_REQUIRED_MESSAGE);
      return;
    }

    setErrors({ email: null, password: null });
    setFormError(null);

    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: normalizedEmail,
        password,
        options: { captchaToken },
      });
      if (error) {
        if (error.code === "email_not_confirmed") {
          // Unverified account: send them to the code screen, where
          // "Resend code" can issue a fresh one.
          setAuthHandoff({ intent: "signup", email: normalizedEmail });
          router.push(AUTH_ROUTES.code);
        } else if (error.code === "over_request_rate_limit" || error.status === 429) {
          setFormError("Too many attempts. Please try again later.");
        } else {
          setFormError(GENERIC_ERROR);
        }
        return;
      }
      router.push(getPostAuthDestination());
    } finally {
      turnstileRef.current?.reset();
    }
  }

  return (
    <AuthCard>
      <AuthHeader title="Log In" subtitle="Welcome back to Gurukul." />
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
        <AuthInput
          id="password"
          name="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          error={errors.password}
        />
        <TurnstileWidget ref={turnstileRef} />
        <HoneypotField value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
        <AuthButton type="submit" className="w-full" disabled={!canSubmit}>
          Login
        </AuthButton>
        <AuthError message={formError} />
      </form>
      <AuthFooterNav>
        <p>
          <Link href={AUTH_ROUTES.recovery} className="text-ochre underline underline-offset-4">
            Forgot Password
          </Link>
        </p>
        <p>
          New here?{" "}
          <Link href={AUTH_ROUTES.signup} className="text-ochre underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </AuthFooterNav>
    </AuthCard>
  );
}
