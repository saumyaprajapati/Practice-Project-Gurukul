"use client";

import AdminNav from "@/components/admin/AdminNav";
import { AdminProfileContext, useRequireAdmin } from "@/lib/admin/guard";

// Wraps every /gurukul/admin* route: admin-only guard (redirects everyone
// else to the Hub) plus the shared admin tab bar.
export default function AdminLayout({ children }) {
  const profile = useRequireAdmin();

  if (!profile) return null;

  return (
    <AdminProfileContext value={profile}>
      <section className="section-manuscript flex-1">
        <div className="section-inner">
          <AdminNav />
          {children}
        </div>
      </section>
    </AdminProfileContext>
  );
}
