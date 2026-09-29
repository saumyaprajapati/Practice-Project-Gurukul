"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ENTER_GURUKUL_HREF, PROFILE_HREF } from "./cta";
import ProfileIcon from "./ProfileIcon";
import ProfileMenu from "./ProfileMenu";

const NAV_LINKS = [
  { label: "Courses", href: "#courses" },
  { label: "How It Works", href: "#learning-experience" },
  { label: "Mentors", href: "#mentors" },
  { label: "About", href: "#problem" },
];

export default function Navbar({ isAuthed, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <header className="section-dark">
      <nav
        aria-label="Primary"
        className="section-inner !py-4 flex items-center justify-between"
      >
        <a href="#hero" className="font-bold tracking-wide">
          GURUKUL
        </a>

        <ul className="hidden md:flex md:items-center md:gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
          {isAuthed ? (
            <li>
              <ProfileMenu onSignOut={onSignOut} />
            </li>
          ) : (
            <li>
              <Link
                href={ENTER_GURUKUL_HREF}
                className="surface-earthy rounded px-4 py-2 font-medium"
              >
                Enter the Gurukul
              </Link>
            </li>
          )}
        </ul>

        <button
          type="button"
          className="md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
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

      <div id="mobile-menu" className={isOpen ? "block md:hidden" : "hidden"}>
        <ul className="section-inner !py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setIsOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
          {isAuthed ? (
            <>
              <li>
                <Link
                  href={PROFILE_HREF}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2"
                >
                  <ProfileIcon />
                  View Profile
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSignOut();
                  }}
                  className="text-left"
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                href={ENTER_GURUKUL_HREF}
                onClick={() => setIsOpen(false)}
                className="surface-earthy inline-block rounded px-4 py-2 font-medium"
              >
                Enter the Gurukul
              </Link>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
