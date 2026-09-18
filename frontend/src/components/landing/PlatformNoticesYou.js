import ScrollJourney from "./ScrollJourney";

const NOTICE_STEPS = [
  {
    id: "enrolled",
    label: "Enrolled",
    note: {
      mentor: "Arjuna",
      message: "Focus is a discipline, not a mood. Let's begin.",
    },
  },
  { id: "watching", label: "Watching" },
  {
    id: "quiz-failed",
    label: "Quiz failed",
    note: {
      mentor: "Karna",
      message: "A setback is not a verdict. Try again — I did.",
    },
  },
  { id: "trying-again", label: "Trying again" },
  {
    id: "inactive",
    label: "Inactive",
    note: {
      mentor: "Babur",
      message: "Even an empire pauses. It doesn't have to end here.",
    },
  },
  {
    id: "returns",
    label: "Returns",
    note: {
      mentor: "Ekalavya",
      message: "You came back. That's the only skill that matters.",
    },
  },
  { id: "completes", label: "Completes" },
];

export default function PlatformNoticesYou() {
  return (
    <section
      id="platform-notices-you"
      aria-labelledby="platform-notices-you-heading"
      className="section-base section-manuscript"
    >
      <div className="section-inner">
        <h2 id="platform-notices-you-heading" className="heading-2">
          What if the platform noticed?
        </h2>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-charcoal/80">
          Gurukul doesn&rsquo;t send generic notifications. It responds to
          what the learner is actually doing.
        </p>

        <div className="mt-8 max-w-md">
          <ScrollJourney steps={NOTICE_STEPS} />
        </div>
      </div>
    </section>
  );
}
