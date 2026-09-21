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
import Captcha from "@/components/auth/Captcha";
import HoneypotField from "@/components/auth/HoneypotField";
import { AUTH_ROUTES, getPostAuthDestination } from "@/lib/auth/routes";
import { generateChallenge, isCorrectAnswer } from "@/lib/auth/captcha";
import { validateEmail, validatePassword } from "@/lib/auth/validation";
import {
  isHoneypotTripped,
  triggerHoneypotLockout,
  isHoneypotLocked,
  HONEYPOT_BLOCKED_MESSAGE,
} from "@/lib/auth/honeypot";

const CAPTCHA_MISMATCH_MESSAGE = "That doesn't match the image. Try again.";

export default function LoginPage() {
  const router = useRouter();
  // Math.random() can't run during SSR render without diverging from the
  // client — the challenge is generated post-mount instead.
  const [challenge, setChallenge] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState({ email: null, password: null, captcha: null });
  const [formError, setFormError] = useState(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the challenge must be generated client-only, post-mount, to avoid a hydration mismatch.
    setChallenge(generateChallenge());
  }, []);

  function handleSubmit(event) {
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
      setErrors({ email: emailError, password: passwordError, captcha: null });
      setFormError(null);
      return;
    }

    if (!isCorrectAnswer(challenge, captchaAnswer)) {
      setErrors({ email: null, password: null, captcha: CAPTCHA_MISMATCH_MESSAGE });
      setFormError(null);
      setChallenge(generateChallenge());
      setCaptchaAnswer("");
      return;
    }

    setErrors({ email: null, password: null, captcha: null });
    setFormError(null);
    router.push(getPostAuthDestination());
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
        {challenge ? (
          <Captcha
            challenge={challenge}
            value={captchaAnswer}
            onChange={(event) => setCaptchaAnswer(event.target.value)}
            error={errors.captcha}
          />
        ) : null}
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
