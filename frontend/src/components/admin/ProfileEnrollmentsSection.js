import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { hasActiveAccess } from "@/lib/courses/enrollment";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

// "Enrolled courses" on the admin profile page — active first, then the
// most recent purchase (enrollments arrive sorted by purchase date).
export default function ProfileEnrollmentsSection({ enrollments }) {
  const sorted = [...enrollments].sort((a, b) => Number(hasActiveAccess(b)) - Number(hasActiveAccess(a)));

  return (
    <section aria-labelledby="enrolled-courses-heading">
      <h2 id="enrolled-courses-heading" className="text-xl font-semibold text-charcoal">
        Enrolled courses
      </h2>

      {sorted.length === 0 ? (
        <p className="mt-4 text-charcoal/80">Not enrolled in any courses yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {sorted.map((enrollment) => {
            const isActive = hasActiveAccess(enrollment);
            return (
              <li key={enrollment.courseId} className="surface-earthy rounded-lg p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={GURUKUL_ROUTES.courseDetail(enrollment.courseId)}
                      className="font-semibold text-charcoal underline-offset-4 hover:underline"
                    >
                      {enrollment.courseTitle}
                    </Link>
                    <p className="text-sm text-charcoal/70">
                      {enrollment.category} · {enrollment.instructor}
                    </p>
                  </div>
                  <StatusBadge status={isActive ? "active" : "expired"} />
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-brown/15"
                    role="progressbar"
                    aria-valuenow={enrollment.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${enrollment.courseTitle} progress`}
                  >
                    <div className="h-full rounded-full bg-gold" style={{ width: `${enrollment.progress}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm text-charcoal/80">{enrollment.progress}%</span>
                </div>

                <p className="mt-2 text-xs text-charcoal/50">
                  Since {formatDate(enrollment.purchasedAt)} · {isActive ? "expires" : "ended"}{" "}
                  {formatDate(enrollment.expiresAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
