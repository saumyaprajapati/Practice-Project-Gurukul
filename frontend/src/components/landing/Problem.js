import ScrollJourney from "./ScrollJourney";

const PROBLEM_STEPS = [
  { id: "enrol", label: "Enrol", opacity: 1 },
  { id: "watch", label: "Watch", opacity: 0.85 },
  { id: "miss-a-lesson", label: "Miss a lesson", opacity: 0.7 },
  { id: "fall-behind", label: "Fall behind", opacity: 0.55 },
  { id: "stop", label: "Stop", opacity: 0.4 },
];

export default function Problem() {
  return (
    <section
      id="problem"
      aria-labelledby="problem-heading"
      className="section-base section-dark"
    >
      <div className="section-inner">
        <h2 id="problem-heading" className="heading-2">
          Online learning forgot the learner.
        </h2>
        <span className="rule-shirorekha" aria-hidden="true" />

        <div className="mt-8 max-w-md">
          <ScrollJourney steps={PROBLEM_STEPS} />
        </div>

        <p className="mt-8 max-w-xl border-l-2 border-ochre pl-4 italic text-cream/80">
          You don&rsquo;t stop learning because the next video disappeared.
          You stop because nobody noticed when you disappeared.
        </p>
      </div>
    </section>
  );
}
