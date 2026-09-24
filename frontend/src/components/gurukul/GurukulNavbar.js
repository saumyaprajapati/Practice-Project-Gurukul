"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileMenu from "@/components/landing/ProfileMenu";
import { logout } from "@/lib/auth/session";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

const BASE_LINKS = [
  { label: "My Learning", href: GURUKUL_ROUTES.learning },
  { label: "Buy Courses", href: GURUKUL_ROUTES.courses },
];

// Authenticated-area navbar. Reuses ProfileMenu exactly as the landing
// Navbar renders it (trailing end of the nav list) — see Dashboard-0 §2.4.
// "My Courses"/"Admin" only show once the profile fetch confirms the role —
// same render-safe-default-then-resolve pattern used throughout this app.
export default function GurukulNavbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [roles, setRoles] = useState({ isInstructor: false, isAdmin: false });

  useEffect(() => {
    let cancelled = false;
    getCurrentUserProfile().then((profile) => {
      if (!cancelled) setRoles({ isInstructor: profile.isInstructor, isAdmin: profile.isAdmin });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  async function handleSignOut() {
    await logout();
    router.push("/");
  }

  const links = [
    ...BASE_LINKS,
    ...(roles.isInstructor ? [{ label: "My Courses", href: GURUKUL_ROUTES.myCourses }] : []),
    ...(roles.isAdmin ? [{ label: "Admin", href: GURUKUL_ROUTES.adminCourses }] : []),
  ];

  return (
    <header className="section-dark">
      <nav
        aria-label="Primary"
        className="section-inner !py-4 flex items-center justify-between"
      >
        <Link href={GURUKUL_ROUTES.home} className="font-bold tracking-wide">
          GURUKUL
        </Link>

        <ul className="hidden md:flex md:items-center md:gap-8">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
          <li>
            <ProfileMenu onSignOut={handleSignOut} />
          </li>
        </ul>

        <button
          type="button"
          className="md:hidden"
          aria-expanded={isOpen}
          aria-controls="gurukul-mobile-menu"
          aria-label="Toggle navigation menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {isOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      <div id="gurukul-mobile-menu" className={isOpen ? "block md:hidden" : "hidden"}>
        <ul className="section-inner !py-4 flex flex-col gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={() => setIsOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <ProfileMenu onSignOut={handleSignOut} />
          </li>
        </ul>
      </div>
    </header>
  );
}
