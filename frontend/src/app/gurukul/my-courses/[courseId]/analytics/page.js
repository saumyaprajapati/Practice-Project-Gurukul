"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthError from "@/components/auth/AuthError";
import StatusBadge from "@/components/admin/StatusBadge";
import OverviewTab from "@/components/gurukul/analytics/OverviewTab";
import StudentsTable from "@/components/gurukul/analytics/StudentsTable";
import { getCourseAnalytics, getCourseStudents } from "@/lib/courses/analytics";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

const TABS = [
  { value: "overview", label: "Overall Analytics" },
  { value: "students", label: "Enrolled Students" },
];

const REFRESH_MS = 60_000;

// Instructor analytics for one of their own courses (admins can open any).
// Ownership is checked by the course_analytics / course_students RPCs.
export default function CourseAnalyticsPage({ params }) {
  const { courseId } = use(params);
  // Only rendered client-side (behind the Hub's auth guard), so reading the
  // URL directly is safe — same as add-content's ?created flag.
  const [tab, setTab] = useState(() => {
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
    return TABS.some((item) => item.value === requested) ? requested : "overview";
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(
    () =>
      Promise.all([getCourseAnalytics(courseId), getCourseStudents(courseId)]).then(([analytics, students]) => ({
        analytics,
        students,
      })),
    [courseId]
  );

  useEffect(() => {
    let cancelled = false;
    function refresh() {
      load()
        .then((result) => {
          if (cancelled) return;
          setData(result);
          setError(null);
          setUpdatedAt(new Date());
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        });
    }

    refresh();
    // Keeps "watching now" and "last active" current while the page is open.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  function handleTabChange(value) {
    setTab(value);
    window.history.replaceState(null, "", `?tab=${value}`);
  }

  const backLink = (
    <p className="text-sm">
      <Link href={GURUKUL_ROUTES.myCourses} className="underline underline-offset-4">
        ← My Courses
      </Link>
    </p>
  );

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        {backLink}

        {error && !data ? (
          <>
            <h1 className="heading-2 mt-4">Course Analytics</h1>
            <span className="rule-shirorekha" aria-hidden="true" />
            <AuthError message={error} />
          </>
        ) : null}

        {data ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="heading-2">{data.analytics.course.title}</h1>
              {data.analytics.course.status !== "approved" ? (
                <StatusBadge
                  status={data.analytics.course.status}
                  label={data.analytics.course.status === "pending" ? "Pending review" : "Declined"}
                />
              ) : null}
            </div>
            <span className="rule-shirorekha" aria-hidden="true" />
            <p className="mt-6 max-w-2xl text-charcoal/80">
              Course Analytics: who&apos;s enrolling, how far they get, and where they stop, so you know which
              lessons to improve.
              {updatedAt ? (
                <span className="ml-2 text-sm text-charcoal/60">
                  Updated {updatedAt.toLocaleTimeString("en-IN", { timeStyle: "short" })}
                </span>
              ) : null}
            </p>

            {/* Refresh failures keep the last good data on screen. */}
            <AuthError message={error} />

            <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Course analytics">
              {TABS.map((item) => (
                <button
                  key={item.value}
                  id={`analytics-tab-${item.value}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.value}
                  aria-controls={`analytics-panel-${item.value}`}
                  onClick={() => handleTabChange(item.value)}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${tab === item.value ? "bg-gold text-charcoal" : "surface-earthy"}`}
                >
                  {item.label}
                  {item.value === "students" ? ` (${data.students.length})` : ""}
                </button>
              ))}
            </div>

            <div
              id={`analytics-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`analytics-tab-${tab}`}
              className="mt-6"
            >
              {tab === "overview" ? (
                <OverviewTab analytics={data.analytics} />
              ) : (
                <StudentsTable
                  students={data.students}
                  totalLessons={data.analytics.totals.totalLessons}
                  courseId={courseId}
                />
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
