"use client";

import GurukulNavbar from "@/components/gurukul/GurukulNavbar";
import { useRequireAuth } from "@/lib/auth/guard";

// Wraps every /gurukul* route: guards access and provides the shared Hub
// navbar, mirroring app/auth/layout.js's role for the auth screens.
export default function GurukulLayout({ children }) {
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
