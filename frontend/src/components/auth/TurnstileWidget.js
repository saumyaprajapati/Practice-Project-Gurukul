"use client";

import { Turnstile } from "@marsidev/react-turnstile";

// Cloudflare Turnstile — Supabase Auth verifies the token server-side
// (Authentication → Attack Protection → Captcha). Tokens are single-use:
// callers read ref.current.getResponse() on submit and call
// ref.current.reset() after every attempt, successful or not.
export default function TurnstileWidget({ ref }) {
  return (
    <div className="mb-4">
      <Turnstile ref={ref} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
    </div>
  );
}
