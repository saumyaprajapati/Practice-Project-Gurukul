"use client";

import { useEffect, useRef, useState } from "react";

// Reveals once when the observed element scrolls into view. Starts at
// false/false on every render (server and client) so there is no
// hydration mismatch — prefers-reduced-motion can't be read during SSR,
// so it's applied from inside the effect, post-mount, instead.
export function useScrollReveal({ threshold = 0.4 } = {}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prefers-reduced-motion can't be read during SSR; this must run post-mount to avoid a hydration mismatch.
      setReducedMotion(true);
      setRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed, reducedMotion };
}
