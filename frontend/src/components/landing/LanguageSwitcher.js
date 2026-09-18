"use client";

import { useState } from "react";
import styles from "./LanguageSwitcher.module.css";

export default function LanguageSwitcher({ languages }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = languages[activeIndex];

  return (
    <div className="mt-8">
      <div
        role="group"
        aria-label="Choose a language"
        className="flex flex-wrap gap-2"
      >
        {languages.map((lang, index) => (
          <button
            key={lang.code}
            type="button"
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              index === activeIndex
                ? "surface-earthy"
                : "border border-brown/40 text-charcoal/70"
            }`}
          >
            {lang.name} · {lang.native}
          </button>
        ))}
      </div>

      <div className={styles.stage}>
        <div
          key={active.code}
          className={`${styles.page} surface-earthy mt-6 max-w-sm rounded-lg p-6 text-center`}
        >
          <p className="text-sm uppercase tracking-wide text-charcoal/60">
            {active.name}
          </p>
          <p className="mt-2 text-2xl text-charcoal">{active.greeting}</p>
        </div>
      </div>
    </div>
  );
}
