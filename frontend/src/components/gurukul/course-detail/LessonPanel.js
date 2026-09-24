import LessonVideoPlayer from "./LessonVideoPlayer";
import LessonResources from "./LessonResources";

// Panel for the currently selected lesson: its video (only if the
// instructor added one), reading content from course_lesson_content, and
// any attached files.
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
      <LessonVideoPlayer key={lesson.lessonId} video={lesson.video} title={lesson.lessonTitle} />

      <p className="text-sm text-charcoal/60">
        {lesson.moduleTitle} · Lesson {lesson.lessonIndex + 1}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-charcoal">{lesson.lessonTitle}</h2>

      <div className="mt-4 max-w-prose space-y-3 text-charcoal/90">
        {lesson.locked ? (
          // Safety net: RLS only withholds lesson text from learners without
          // access, and those never reach this panel.
          <p className="leading-relaxed text-charcoal/70">Enrol to read this lesson.</p>
        ) : (
          lesson.content.map((paragraph, index) => (
            <p key={index} className="leading-relaxed">
              {paragraph}
            </p>
          ))
        )}
      </div>

      <LessonResources key={`files-${lesson.lessonId}`} files={lesson.files ?? []} />

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
