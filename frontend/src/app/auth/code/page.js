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
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import { AUTH_ROUTES, getPostAuthDestination } from "@/lib/auth/routes";
import { getAuthHandoff, clearAuthHandoff } from "@/lib/auth/handoff";
import { maskEmail } from "@/lib/auth/email";
import { getSupabase } from "@/lib/supabase/client";

const CODE_LENGTH = 6;

// Verifies the emailed Supabase Auth code. Signup codes confirm the email
// and sign the user in; recovery codes sign the user in just long enough
// for /auth/recovery/reset to set a new password.
export default function CodePage() {
  const router = useRouter();
  const turnstileRef = useRef(null);
  const [handoff, setHandoff] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const pending = getAuthHandoff();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage can't be read during SSR; this must run post-mount to avoid a hydration mismatch.
    setHandoff(pending);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (code.length !== CODE_LENGTH) {
      setError("Incorrect Code Enterred");
      return;
    }

    const { error: verifyError } = await getSupabase().auth.verifyOtp({
      email: handoff.email,
      token: code,
      type: handoff.intent === "recovery" ? "recovery" : "email",
    });
    if (verifyError) {
      setError("Incorrect Code Enterred");
      return;
    }

    clearAuthHandoff();
    router.push(handoff.intent === "recovery" ? AUTH_ROUTES.recoveryReset : getPostAuthDestination());
  }

  async function handleResend() {
    setError(null);
    setStatus(null);

    const captchaToken = turnstileRef.current?.getResponse();
    if (!captchaToken) {
      setError("Please complete the security check.");
      return;
    }

    setIsResending(true);
    const supabase = getSupabase();
    try {
      const { error: resendError } =
        handoff.intent === "recovery"
          ? await supabase.auth.resetPasswordForEmail(handoff.email, { captchaToken })
          : await supabase.auth.resend({ type: "signup", email: handoff.email, options: { captchaToken } });
      if (resendError) {
        setError(resendError.message);
      } else {
        setStatus("A new code is on its way.");
      }
    } finally {
      turnstileRef.current?.reset();
      setIsResending(false);
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
        subtitle={`Enter the ${CODE_LENGTH}-digit code we sent to ${maskEmail(handoff.email)}.`}
      />
      <form onSubmit={handleSubmit} noValidate>
        <AuthError message={error} />
        <AuthInput
          id="code"
          name="code"
          label="Verification Code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          required
          hint={`${CODE_LENGTH}-digit code`}
        />
        <AuthButton type="submit" className="w-full">
          Continue
        </AuthButton>
      </form>

      <div className="mt-6">
        <p className="mb-2 text-sm text-charcoal/70">Didn&apos;t get a code?</p>
        <TurnstileWidget ref={turnstileRef} />
        <AuthButton type="button" variant="secondary" onClick={handleResend} disabled={isResending}>
          {isResending ? "Sending..." : "Resend code"}
        </AuthButton>
        {status ? (
          <p role="status" aria-live="polite" className="mt-3 text-sm text-charcoal/80">
            {status}
          </p>
        ) : null}
      </div>
    </AuthCard>
  );
}
