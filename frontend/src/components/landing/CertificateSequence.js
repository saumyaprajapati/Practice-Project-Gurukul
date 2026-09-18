"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CertificateSequence.module.css";

export default function CertificateSequence() {
  const wrapRef = useRef(null);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [revealed, setRevealed] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;

    const el = wrapRef.current;
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
    <div>
      <div
        ref={wrapRef}
        className={`${styles.certificate} ${revealed ? styles.revealed : ""} surface-earthy relative mx-auto max-w-md rounded-lg p-8 text-center`}
      >
        <div className={styles.parchment}>
          <p className="text-xs uppercase tracking-widest text-brown/70">
            Certificate of Completion
          </p>
          <span className="rule-shirorekha mx-auto" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold text-charcoal">
            Python Foundations
          </p>
          <p className="mt-1 text-sm text-charcoal/70">
            Awarded to: a Gurukul learner
          </p>

          <div className={`${styles.seal} mt-6`} aria-hidden="true">
            <svg viewBox="0 0 60 60" width="48" height="48">
              <circle cx="30" cy="30" r="27" fill="none" stroke="var(--lapis)" strokeWidth="2" />
              <circle cx="30" cy="30" r="20" fill="var(--lapis)" opacity="0.15" />
              <text
                x="30"
                y="34"
                textAnchor="middle"
                fill="var(--lapis)"
                fontSize="14"
                fontWeight="600"
                fontFamily="var(--font-anek), ui-sans-serif, system-ui, sans-serif"
              >
                G
              </text>
            </svg>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-xs text-charcoal/50">
        A preview of your completion certificate — not an official
        credential.
      </p>
    </div>
  );
}
