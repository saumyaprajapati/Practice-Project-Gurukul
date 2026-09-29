"use client";

import GurukulNavbar from "@/components/gurukul/GurukulNavbar";
import { useRequireAuth } from "@/lib/auth/guard";

// Guards /profile and gives it the same Hub navbar as /gurukul*, so
// reaching Profile from the profile menu doesn't drop the learner into a
// navbar-less dead end. Mirrors app/gurukul/layout.js exactly — same guard
// hook, no second mechanism.
export default function ProfileRouteLayout({ children }) {
  const isChecked = useRequireAuth();

  if (!isChecked) return null;

  return (
    <>
      <GurukulNavbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}
