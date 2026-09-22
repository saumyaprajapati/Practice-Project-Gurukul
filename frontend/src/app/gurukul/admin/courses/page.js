"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";
import { formatPrice } from "@/lib/courses/currency";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { getPendingCourses, approveCourse, declineCourse } from "@/lib/admin/courses";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

export default function AdminCoursesPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(null);
  const [courses, setCourses] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserProfile().then((profile) => {
      if (cancelled) return;
      if (!profile.isAdmin) {
        router.replace(GURUKUL_ROUTES.home);
        return;
      }
      setIsAdmin(true);
      getPendingCourses().then((data) => {
        if (!cancelled) setCourses(data);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleDecision(courseId, decide) {
    setPendingId(courseId);
    await decide(courseId);
    setCourses((prev) => prev.filter((course) => course.id !== courseId));
    setPendingId(null);
  }

  if (!isAdmin || !courses) return null;

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        <h1 className="heading-2">Pending Courses</h1>
        <span className="rule-shirorekha" aria-hidden="true" />

        <div className="mt-6">
          <Link href={GURUKUL_ROUTES.adminDeletionRequests} className="underline underline-offset-4 text-sm">
            View Deletion Requests
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="mt-8 text-charcoal/80">Nothing waiting for review.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {courses.map((course) => (
              <li key={course.id} className="surface-earthy rounded-lg p-4">
                <h2 className="font-semibold text-charcoal">{course.title}</h2>
                <p className="text-sm text-charcoal/70">
                  {course.category} · {course.instructor} · {formatPrice(course.price)}
                </p>
                <p className="mt-2 text-sm text-charcoal/80">{course.description}</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={GURUKUL_ROUTES.courseDetail(course.id)} className="underline underline-offset-4 text-sm">
                    Preview
                  </Link>
                  <AuthButton
                    type="button"
                    disabled={pendingId === course.id}
                    onClick={() => handleDecision(course.id, approveCourse)}
                  >
                    Approve
                  </AuthButton>
                  <AuthButton
                    type="button"
                    variant="secondary"
                    disabled={pendingId === course.id}
                    onClick={() => handleDecision(course.id, declineCourse)}
                  >
                    Decline
                  </AuthButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
