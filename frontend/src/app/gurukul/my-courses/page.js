"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";
import { formatPrice } from "@/lib/courses/currency";
import { getMyCourses, requestCourseDeletion } from "@/lib/courses/creator";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

const STATUS_LABEL = {
  pending: "Pending review",
  approved: "Approved",
  declined: "Declined",
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState(null);
  const [pendingRequestId, setPendingRequestId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyCourses().then((data) => {
      if (!cancelled) setCourses(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRequestDeletion(courseId) {
    setPendingRequestId(courseId);
    await requestCourseDeletion(courseId);
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId ? { ...course, hasPendingDeletionRequest: true } : course
      )
    );
    setPendingRequestId(null);
  }

  if (!courses) return null;

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        <h1 className="heading-2">My Courses</h1>
        <span className="rule-shirorekha" aria-hidden="true" />

        <div className="mt-8 flex justify-end">
          <Link href={GURUKUL_ROUTES.createCourse} className="surface-earthy rounded px-4 py-2 text-sm font-medium">
            Create a Course
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="mt-8 text-charcoal/80">You haven&apos;t created any courses yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {courses.map((course) => (
              <li key={course.id} className="surface-earthy rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-charcoal">{course.title}</h2>
                    <p className="text-sm text-charcoal/70">
                      {course.category} · {formatPrice(course.price)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-charcoal/80">
                    {STATUS_LABEL[course.status]}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <Link href={GURUKUL_ROUTES.myCourseAddContent(course.id)} className="underline underline-offset-4">
                    Add Content
                  </Link>
                  <Link href={GURUKUL_ROUTES.myCourseAnalytics(course.id)} className="underline underline-offset-4">
                    Course Analytics
                  </Link>
                  {course.status === "approved" ? (
                    <Link href={GURUKUL_ROUTES.courseDetail(course.id)} className="underline underline-offset-4">
                      View Course
                    </Link>
                  ) : null}
                  {course.hasPendingDeletionRequest ? (
                    <span className="text-charcoal/60">Deletion requested</span>
                  ) : (
                    <AuthButton
                      type="button"
                      variant="secondary"
                      disabled={pendingRequestId === course.id}
                      onClick={() => handleRequestDeletion(course.id)}
                    >
                      Request Deletion
                    </AuthButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
