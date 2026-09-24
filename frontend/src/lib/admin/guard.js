"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// Admin-only page guard, same shape as lib/auth/guard.js's useRequireAuth:
// returns the admin's profile once confirmed (null until then) and sends
// everyone else back to the Hub. This only hides the UI — the database
// itself rejects non-admins in every admin_* RPC and RLS policy.
export function useRequireAdmin() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserProfile()
      .then((data) => {
        if (cancelled) return;
        if (!data.isAdmin) {
          router.replace(GURUKUL_ROUTES.home);
          return;
        }
        setProfile(data);
      })
      .catch(() => {
        if (!cancelled) router.replace(GURUKUL_ROUTES.home);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return profile;
}

// app/gurukul/admin/layout.js runs useRequireAdmin() once and shares the
// signed-in admin's profile with every admin page through this context
// (e.g. so the Users page can disable actions on the admin's own row).
export const AdminProfileContext = createContext(null);

export function useAdminProfile() {
  return useContext(AdminProfileContext);
}
