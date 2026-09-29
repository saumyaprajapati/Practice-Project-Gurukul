import { getMentor } from "./mentorsData";
import styles from "./ProductExperience.module.css";

const LESSONS = [
  { id: "variables", label: "Introduction to Variables", state: "done" },
  { id: "control-flow", label: "Control Flow", state: "done" },
  { id: "functions", label: "Functions & Scope", state: "current" },
  { id: "lists", label: "Working with Lists", state: "upcoming" },
];

const BENEFITS = [
  {
    id: "resume",
    title: "Resume anywhere",
    description: "Your position is remembered.",
  },
  {
    id: "language",
    title: "Learn in your language",
    description: "English, Hindi, Gujarati, Marathi, Tamil and Bengali.",
  },
  {
    id: "keep-moving",
    title: "Keep moving",
    description:
      "Your learning experience should remain usable across devices and realistic network conditions.",
  },
];

function LessonMarker({ state }) {
  if (state === "done") {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="var(--gold)" />
        <path
          d="M6 10l3 3 6-6"
          fill="none"
          stroke="var(--charcoal)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (state === "current") {
    return (
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="none" stroke="var(--gold)" strokeWidth="2" />
        <circle cx="10" cy="10" r="4" fill="var(--gold)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="var(--cream)" strokeOpacity="0.4" strokeWidth="2" />
    </svg>
  );
}

export default function ProductExperience() {
  const mentor = getMentor("arjuna");

  return (
    <section
      id="learning-experience"
      aria-labelledby="learning-experience-heading"
      className="section-base section-dark"
    >
      <div className="section-inner">
        <h2 id="learning-experience-heading" className="heading-2">
          Beautiful outside. Serious underneath.
        </h2>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-cream/80">
          A preview of what the learning experience looks and feels like.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <div className="surface-earthy overflow-hidden rounded-lg p-4">
              <div className="relative flex aspect-video items-center justify-center rounded bg-charcoal">
                <svg viewBox="0 0 60 60" width="48" height="48" aria-hidden="true">
                  <circle cx="30" cy="30" r="28" fill="var(--gold)" opacity="0.9" />
                  <path d="M24 20l20 10-20 10z" fill="var(--charcoal)" />
                </svg>
                <span className="absolute right-3 bottom-3 text-xs text-cream/70">
                  4:12 / 10:30
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brown/40">
                <div className="h-full w-[40%] rounded-full bg-gold" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="surface-earthy rounded-lg p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-charcoal/70">
                  Quick check
                </p>
                <p className="mt-2 font-medium text-charcoal">
                  What does <code>len()</code> return?
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="rounded border border-ochre bg-ochre/10 px-3 py-2 text-charcoal">
                    The number of items in a sequence
                  </div>
                  <div className="rounded border border-brown/30 px-3 py-2 text-charcoal/70">
                    The type of a sequence
                  </div>
                </div>
              </div>

              <div className={`surface-earthy rounded-lg p-4 ${styles.notesLines}`}>
                <p className="text-sm font-semibold uppercase tracking-wide text-charcoal/70">
                  Notes
                </p>
                <p className="mt-3 text-sm italic text-charcoal/80">
                  Remember: list slicing is [start:end:step].
                </p>
                <p className="mt-6 text-sm italic text-charcoal/80">
                  Ask about negative indices next lesson.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="surface-earthy inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium">
              Resume: Lesson 3 · 04:12 remaining
            </div>

            <ol className="surface-earthy space-y-3 rounded-lg p-4">
              {LESSONS.map((lesson) => (
                <li
                  key={lesson.id}
                  className={`flex items-center gap-2 text-sm ${
                    lesson.state === "current" ? "font-semibold text-gold" : "text-charcoal/80"
                  }`}
                >
                  <LessonMarker state={lesson.state} />
                  {lesson.label}
                </li>
              ))}
            </ol>

            <div className="surface-earthy rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 56 56" width="36" height="36" aria-hidden="true">
                  <circle cx="28" cy="28" r="27" fill="var(--brown)" stroke="var(--gold)" strokeWidth="1.5" />
                  <text
                    x="28"
                    y="29"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--cream)"
                    fontSize="20"
                    fontWeight="600"
                    fontFamily="var(--font-anek), ui-sans-serif, system-ui, sans-serif"
                  >
                    {mentor.name.charAt(0)}
                  </text>
                </svg>
                <p className="text-sm font-semibold">{mentor.name}</p>
              </div>
              <p className="font-dialogue mt-3 text-sm italic text-charcoal/80">
                &ldquo;{mentor.dialogue}&rdquo;
              </p>
            </div>
          </div>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit.id}>
              <p className="font-semibold uppercase tracking-wide text-gold">
                {benefit.title}
              </p>
              <p className="mt-2 text-sm text-cream/80">{benefit.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
