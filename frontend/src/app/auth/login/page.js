"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import Captcha from "@/components/auth/Captcha";
import HoneypotField from "@/components/auth/HoneypotField";
import { AUTH_ROUTES, getPostAuthDestination } from "@/lib/auth/routes";
import { generateChallenge } from "@/lib/auth/captcha";

export default function LoginPage() {
  const router = useRouter();
  // Math.random() can't run during SSR render without diverging from the
  // client — the challenge is generated post-mount instead.
  const [challenge, setChallenge] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the challenge must be generated client-only, post-mount, to avoid a hydration mismatch.
    setChallenge(generateChallenge());
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
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
        />
        {challenge ? (
          <Captcha
            challenge={challenge}
            value={captchaAnswer}
            onChange={(event) => setCaptchaAnswer(event.target.value)}
          />
        ) : null}
        <HoneypotField value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
        <AuthButton type="submit" className="w-full">
          Log In
        </AuthButton>
      </form>
      <p className="mt-4 text-sm">
        <Link href={AUTH_ROUTES.recovery} className="text-ochre underline underline-offset-4">
          Forgot password?
        </Link>
      </p>
      <p className="mt-2 text-sm text-charcoal/80">
        New here?{" "}
        <Link href={AUTH_ROUTES.signup} className="text-ochre underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
