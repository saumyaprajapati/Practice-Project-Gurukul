import { getCourseState } from "@/lib/courses/enrollment";

// Extends the same chaitya-arch/surface-earthy pattern as BuyCourseCard,
// with a progress bar and a state-driven CTA instead of a price. No actual
// playback (Dashboard-2 §"Learning course states") — the CTA is the same
// inert-button placeholder pattern BuyCourseCard already established.
const CTA_LABEL = {
  "not-started": "Start Learning",
  "in-progress": "Continue Learning",
  completed: "View Course",
};

export default function MyLearningCourseCard({ course, enrollment }) {
  const { title, category, instructor, image } = course;
  const initial = title.charAt(0);
  const progress = enrollment?.progress ?? 0;
  const state = getCourseState(enrollment);

  return (
    <li className="surface-earthy flex h-full flex-col rounded-lg p-4 shadow-sm transition-shadow hover:shadow-lg">
      <div
        className="relative mx-auto aspect-[4/5] w-32 sm:w-40"
        style={{ clipPath: "url(#chaitya-arch)" }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- thumbnail source is mock data, not a static asset.
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-ochre to-brown">
            <span className="text-3xl font-semibold text-cream">{initial}</span>
          </div>
        )}
      </div>

      <h3 className="mt-4 text-center font-semibold text-charcoal">{title}</h3>
      <p className="mt-1 text-center text-sm text-charcoal/70">
        {category} · {instructor}
      </p>

      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} progress`}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brown/20"
      >
        <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-center text-sm text-charcoal/70">{progress}% complete</p>

      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Course playback isn't available yet."
        className="surface-earthy mt-4 block rounded px-4 py-2 text-center text-sm font-medium opacity-60"
      >
        {CTA_LABEL[state]}
      </button>
    </li>
  );
}
