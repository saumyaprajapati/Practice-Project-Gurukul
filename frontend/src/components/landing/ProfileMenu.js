"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProfileIcon from "./ProfileIcon";
import { PROFILE_HREF } from "./cta";

export default function ProfileMenu({ onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Account menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <ProfileIcon />
      </button>
      {isOpen ? (
        <div role="menu" className="surface-earthy absolute right-0 z-50 mt-2 min-w-40 rounded p-2">
          <Link
            href={PROFILE_HREF}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block rounded px-3 py-2 text-sm hover:text-ochre"
          >
            View Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
            className="block w-full rounded px-3 py-2 text-left text-sm hover:text-ochre"
          >
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
