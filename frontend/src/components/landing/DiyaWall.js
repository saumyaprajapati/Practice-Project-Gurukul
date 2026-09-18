"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DiyaWall.module.css";

export default function DiyaWall({ milestones }) {
  const wallRef = useRef(null);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [revealed, setRevealed] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;

    const el = wallRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={wallRef}
      className={`${styles.wall} ${revealed ? styles.revealed : ""} relative overflow-hidden rounded-lg p-6 sm:p-8`}
    >
      <div className={`${styles.texture} absolute inset-0`} aria-hidden="true" />

      <ul className="relative z-10 flex flex-wrap justify-center gap-6 sm:gap-8">
        {milestones.map((milestone, index) => {
          const delayMs = reducedMotion ? 0 : index * 120;

          return (
            <li
              key={milestone.id}
              className="flex w-20 flex-col items-center gap-2 text-center sm:w-24"
            >
              <svg
                viewBox="0 0 56 60"
                width="40"
                height="43"
                aria-hidden="true"
              >
                <ellipse cx="28" cy="46" rx="20" ry="6" fill="var(--gold)" opacity="0.9" />
                <path
                  d="M9,46 Q28,58 47,46 Q42,38 28,38 Q14,38 9,46 Z"
                  fill="var(--ochre)"
                />
                <path
                  d="M28,38 C22,26 20,16 28,4 C36,16 34,26 28,38 Z"
                  className={styles.flamePath}
                  style={{ transitionDelay: `${delayMs}ms` }}
                />
              </svg>
              <span className="text-xs text-cream/80 sm:text-sm">
                {milestone.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
