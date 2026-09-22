"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "./session";
import { AUTH_ROUTES } from "./routes";

// Client-side route guard for authenticated-only pages, following the same
// isAuthenticated()-in-a-useEffect pattern already used in
// app/auth/login/page.js and app/auth/signup/page.js (there's no
// middleware in this project — every auth-state redirect is client-side).
// Returns true once the learner is confirmed authenticated, so callers can
// withhold protected content until then instead of flashing it first.
export function useRequireAuth() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    isAuthenticated().then((authed) => {
      if (cancelled) return;
      if (!authed) {
        router.replace(AUTH_ROUTES.login);
        return;
      }
      setChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return checked;
}
