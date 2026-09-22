import Link from "next/link";
import { formatPrice } from "@/lib/courses/currency";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// Not-enrolled sidebar: price, a quick "what's included" summary derived
// from curriculum, and the enroll/renew action, which now navigates to a
// mock checkout page rather than being inert.
export default function CourseSidebarCard({ course, isExpired, expiresAt, curriculum }) {
  const moduleCount = curriculum.modules.length;
  const lessonCount = curriculum.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const totalMinutes = curriculum.modules.reduce(
    (sum, module) => sum + module.lessons.reduce((s, lesson) => s + lesson.durationMinutes, 0),
    0
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <div className="surface-earthy rounded-lg p-6">
      {isExpired ? (
        <p className="mb-4 rounded bg-ochre/10 px-3 py-2 text-sm font-medium text-ochre">
          Your access to this course expired on {expiresAt}.
        </p>
      ) : null}

      <p className="text-2xl font-semibold text-charcoal">{formatPrice(course.price)}</p>

      <ul className="mt-4 space-y-1 text-sm text-charcoal/70">
        <li>{moduleCount} modules</li>
        <li>{lessonCount} lessons</li>
        <li>~{totalHours} hours total</li>
      </ul>

      <Link
        href={GURUKUL_ROUTES.checkout(course.id)}
        className="surface-earthy mt-6 block w-full rounded px-4 py-2 text-center text-sm font-medium"
      >
        {isExpired ? "Renew Access" : "Enroll Now"}
      </Link>
    </div>
  );
}
