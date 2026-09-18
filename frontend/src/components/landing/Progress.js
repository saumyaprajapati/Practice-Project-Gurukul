import DiyaWall from "./DiyaWall";

const MILESTONES = [
  { id: "lesson-1", label: "Lesson 1 completed" },
  { id: "quiz-passed", label: "Quiz passed" },
  { id: "streak-3", label: "3-day streak" },
  { id: "halfway", label: "Milestone reached: Halfway there" },
  { id: "lesson-6", label: "Lesson 6 completed" },
  { id: "streak-7", label: "7-day streak" },
  { id: "course-complete", label: "Course completed" },
];

export default function Progress() {
  return (
    <section
      id="progress"
      aria-labelledby="progress-heading"
      className="section-base section-manuscript"
    >
      <div className="section-inner">
        <h2 id="progress-heading" className="heading-2">
          Progress you can feel.
        </h2>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-charcoal/80">
          Every lesson, streak, and quiz you complete lights another lamp.
        </p>

        <div className="mt-10">
          <DiyaWall milestones={MILESTONES} />
        </div>
      </div>
    </section>
  );
}
