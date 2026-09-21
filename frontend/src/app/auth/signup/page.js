"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthFooterNav from "@/components/auth/AuthFooterNav";
import HoneypotField from "@/components/auth/HoneypotField";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { setAuthHandoff } from "@/lib/auth/handoff";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setAuthHandoff({ intent: "signup", email });
    router.push(AUTH_ROUTES.code);
  }

  return (
    <AuthCard>
      <AuthHeader title="Sign Up" subtitle="Begin your journey with Gurukul." />
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
        <HoneypotField value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
        <AuthButton type="submit" className="w-full">
          Sign Up
        </AuthButton>
      </form>
      <AuthFooterNav>
        <p>
          Already have an account?{" "}
          <Link href={AUTH_ROUTES.login} className="text-ochre underline underline-offset-4">
            Log in
          </Link>
        </p>
      </AuthFooterNav>
    </AuthCard>
  );
}
