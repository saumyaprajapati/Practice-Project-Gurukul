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
import { AUTH_ROUTES, getPostAuthDestination } from "@/lib/auth/routes";
import { getAuthHandoff, clearAuthHandoff } from "@/lib/auth/handoff";
import { issueVerificationCode, verifyCode, clearVerificationCode, INCORRECT_CODE_MESSAGE } from "@/lib/auth/code";
import { maskEmail } from "@/lib/auth/email";

export default function CodePage() {
  const router = useRouter();
  const [handoff, setHandoff] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const pending = getAuthHandoff();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage can't be read during SSR; this must run post-mount to avoid a hydration mismatch.
    setHandoff(pending);
    if (pending) {
      issueVerificationCode();
    }
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (verifyCode(code)) {
      clearVerificationCode();
      clearAuthHandoff();
      router.push(getPostAuthDestination());
    } else {
      setError(INCORRECT_CODE_MESSAGE);
    }
  }

  if (handoff === null) {
    return (
      <AuthCard>
        <AuthHeader title="Verify Code" />
        <p className="text-charcoal/80">
          No pending verification was found. Please start again from sign up
          or password recovery.
        </p>
        <AuthFooterNav>
          <p>
            <Link href={AUTH_ROUTES.signup} className="text-ochre underline underline-offset-4">
              Back to sign up
            </Link>
          </p>
          <p>
            <Link href={AUTH_ROUTES.recovery} className="text-ochre underline underline-offset-4">
              Back to password recovery
            </Link>
          </p>
        </AuthFooterNav>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Verify Code"
        subtitle={`Enter the 4-digit code we sent to ${maskEmail(handoff.email)}.`}
      />
      <form onSubmit={handleSubmit} noValidate>
        <AuthError message={error} />
        <AuthInput
          id="code"
          name="code"
          label="Verification Code"
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
          required
          hint="4-digit code"
        />
        <AuthButton type="submit" className="w-full">
          Continue
        </AuthButton>
      </form>
    </AuthCard>
  );
}
