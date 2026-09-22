function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-gold"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// Renders the module/lesson list for the Course Detail page. `interactive`
// is false in the not-enrolled overview (locked, read-only rows) and true
// in the enrolled learning experience (clickable lessons with active/
// completed states), so the same component serves both branches described
// in the plan rather than two near-duplicate lists.
export default function SyllabusNav({
  curriculum,
  interactive = false,
  currentLessonId,
  completedLessonIds,
  onSelectLesson,
}) {
  return (
    <div className="space-y-4">
      {curriculum.modules.map((module) => (
        <div key={module.id} className="surface-earthy rounded-lg p-4">
          <h3 className="font-semibold text-charcoal">{module.title}</h3>
          <ul className="mt-3 space-y-1">
            {module.lessons.map((lesson) => {
              const isCompleted = completedLessonIds?.has(lesson.id);
              const isActive = interactive && currentLessonId === lesson.id;

              if (!interactive) {
                return (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between gap-3 rounded px-3 py-2 text-sm text-charcoal/60"
                  >
                    <span className="flex items-center gap-2">
                      <LockIcon />
                      {lesson.title}
                    </span>
                    <span className="shrink-0 text-charcoal/50">
                      {lesson.durationMinutes} min
                    </span>
                  </li>
                );
              }

              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => onSelectLesson(lesson.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm transition-colors hover:bg-gold/10 ${
                      isActive ? "border-l-4 border-gold bg-gold/10 pl-2 font-medium" : "text-charcoal/80"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isCompleted ? <CheckIcon /> : <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-brown/40" />}
                      {lesson.title}
                    </span>
                    <span className="shrink-0 text-charcoal/50">
                      {lesson.durationMinutes} min
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
