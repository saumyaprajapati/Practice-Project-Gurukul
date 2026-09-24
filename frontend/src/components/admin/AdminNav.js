"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

const TABS = [
  { label: "Dashboard", href: GURUKUL_ROUTES.admin, exact: true },
  { label: "Courses", href: GURUKUL_ROUTES.adminCourses },
  { label: "Users", href: GURUKUL_ROUTES.adminUsers },
  { label: "Enrollments", href: GURUKUL_ROUTES.adminEnrollments },
  { label: "Deletion Requests", href: GURUKUL_ROUTES.adminDeletionRequests },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="mb-8 flex flex-wrap gap-2 border-b border-brown/20 pb-4">
      {TABS.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              isActive ? "bg-gold text-charcoal" : "text-charcoal/80 hover:bg-gold/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
