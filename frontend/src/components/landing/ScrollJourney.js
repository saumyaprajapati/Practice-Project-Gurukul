"use client";

import { useEffect, useRef } from "react";
import styles from "./ScrollJourney.module.css";

export default function ScrollJourney({ steps }) {
  const itemRefs = useRef([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const items = itemRefs.current.filter(Boolean);
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.dataset.active = entry.isIntersecting
            ? "true"
            : "false";
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [steps]);

  return (
    <ol className={styles.list}>
      {steps.map((step, index) => (
        <li
          key={step.id}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          data-active="false"
          className={`${styles.step} mt-2 font-semibold uppercase tracking-wide`}
          style={{ opacity: step.opacity ?? 1 }}
        >
          {step.label}

          {step.note && (
            <div className={`${styles.note} mt-2 rounded p-3 text-sm normal-case tracking-normal`}>
              <p className="opacity-80">
                {step.label} → platform notices →{" "}
                <strong>{step.note.mentor}</strong> appears
              </p>
              <p className="font-dialogue mt-2 italic">
                “{step.note.message}”
              </p>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
