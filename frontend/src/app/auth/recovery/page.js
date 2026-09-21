"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthFooterNav from "@/components/auth/AuthFooterNav";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { setAuthHandoff } from "@/lib/auth/handoff";

export default function RecoveryPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setAuthHandoff({ intent: "recovery", email });
    router.push(AUTH_ROUTES.code);
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
        />
        <AuthButton type="submit" className="w-full">
          Send Code
        </AuthButton>
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
