import LessonVideoPlayer from "./LessonVideoPlayer";

// Reading-content panel for the currently selected lesson. Content is mock
// text (lib/courses/curriculum.js) standing in for real lesson material —
// the video player above it is simulated too (no real media backend).
export default function LessonPanel({
  lesson,
  isCompleted,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onMarkComplete,
}) {
  return (
    <div className="surface-earthy rounded-lg p-6 sm:p-8">
      <LessonVideoPlayer key={lesson.lessonId} lesson={lesson} />

      <p className="text-sm text-charcoal/60">
        {lesson.moduleTitle} · Lesson {lesson.lessonIndex + 1}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-charcoal">{lesson.lessonTitle}</h2>

      <div className="mt-4 max-w-prose space-y-3 text-charcoal/90">
        {lesson.content.map((paragraph, index) => (
          <p key={index} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      <span className="rule-shirorekha" aria-hidden="true" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="surface-earthy rounded px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Previous
        </button>

        {isCompleted ? (
          <span className="rounded px-4 py-2 text-sm font-medium text-gold">Completed</span>
        ) : (
          <button
            type="button"
            onClick={onMarkComplete}
            className="rounded bg-gold px-4 py-2 text-sm font-medium text-charcoal"
          >
            Mark Complete
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="surface-earthy rounded px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
