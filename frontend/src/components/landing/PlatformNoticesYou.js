import ScrollJourney from "./ScrollJourney";
import { getMentor } from "./mentorsData";

function toNote(mentor) {
  return { mentor: mentor.name, message: mentor.dialogue };
}

const NOTICE_STEPS = [
  { id: "enrolled", label: "Enrolled", note: toNote(getMentor("arjuna")) },
  { id: "watching", label: "Watching" },
  {
    id: "quiz-failed",
    label: "Quiz failed",
    note: toNote(getMentor("karna")),
  },
  { id: "trying-again", label: "Trying again" },
  { id: "inactive", label: "Inactive", note: toNote(getMentor("babur")) },
  { id: "returns", label: "Returns", note: toNote(getMentor("ekalavya")) },
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
