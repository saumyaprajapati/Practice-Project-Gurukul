import { getCourseState } from "@/lib/courses/enrollment";

const STATE_LABEL = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

// Enrolled sidebar: session-computed progress, same bar look as
// MyLearningCourseCard. Never reads/writes the stored mock
// enrollment.progress value directly — percent here is always derived
// fresh from completedCount/totalCount for the current session.
export default function ProgressCard({ completedCount, totalCount, percent }) {
  const state = getCourseState({ progress: percent });

  return (
    <div className="surface-earthy rounded-lg p-6">
      <p className="text-sm font-medium text-charcoal/70">Your Progress</p>
      <p className="mt-1 text-3xl font-semibold text-charcoal">{percent}%</p>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course progress"
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brown/20"
      >
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>

      <p className="mt-2 text-sm text-charcoal/70">
        {completedCount} of {totalCount} lessons complete
      </p>
      <p className="mt-1 text-sm font-medium text-charcoal/80">{STATE_LABEL[state]}</p>
    </div>
  );
}
