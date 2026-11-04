"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCourseById, getCourseCurriculum } from "@/lib/courses/courses";
import { getEnrollmentForCourse, hasActiveAccess } from "@/lib/courses/enrollment";
import { getLessonProgress } from "@/lib/courses/progress";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";
import Link from "next/link";
import CourseHero from "@/components/gurukul/course-detail/CourseHero";
import CourseOverview from "@/components/gurukul/course-detail/CourseOverview";
import CourseLearningExperience from "@/components/gurukul/course-detail/CourseLearningExperience";
import CourseNotFound from "@/components/gurukul/CourseNotFound";

// A single route serving both Course Detail states: a browsable overview
// with a locked syllabus for courses you don't have active access to
// (never purchased, or expired — both grouped the same way
// courses/purchasable already does), and the full interactive lesson
// experience for courses you own. Both BuyCourseCard and
// MyLearningCourseCard link here. The course id comes from ?id= (the site
// is a static export, see lib/gurukul/routes.js), so the existence check and
// per-course <title> happen here in the browser. RLS hides pending/declined
// courses from anyone but their owner, admins and enrolled learners — they
// come back as no row and show "Course not found".
export default function CourseDetailPage() {
  return (
    <Suspense fallback={null}>
      <CourseDetail />
    </Suspense>
  );
}

function CourseDetail() {
  const courseId = useSearchParams().get("id") ?? "";
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCourseById(courseId)
      .catch(() => null)
      .then((course) => {
        if (!course) return { course: null };
        return Promise.all([
          getEnrollmentForCourse(courseId),
          getLessonProgress(courseId),
          getCourseCurriculum(courseId),
          getCurrentUserProfile().catch(() => null),
        ]).then(([enrollment, completedLessonIds, curriculum, profile]) => ({
          course,
          enrollment,
          completedLessonIds,
          curriculum,
          isAdmin: Boolean(profile?.isAdmin),
        }));
      })
      .then((result) => {
        if (cancelled) return;
        if (result.course) document.title = `${result.course.title} — Gurukul`;
        setData(result);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!data) return null;
  if (!data.course) return <CourseNotFound />;

  const { course, enrollment, completedLessonIds, curriculum, isAdmin } = data;
  const hasAccess = hasActiveAccess(enrollment);
  const isExpired = enrollment?.status === "expired";

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        {isAdmin ? (
          <p className="mb-4 text-right text-sm">
            <Link href={GURUKUL_ROUTES.adminCourseEdit(course.id)} className="font-medium underline underline-offset-4">
              Edit as admin
            </Link>
          </p>
        ) : null}
        <CourseHero course={course} />

        {hasAccess ? (
          <CourseLearningExperience
            curriculum={curriculum}
            initialCompletedLessonIds={completedLessonIds}
          />
        ) : (
          <CourseOverview
            course={course}
            curriculum={curriculum}
            isExpired={isExpired}
            expiresAt={enrollment?.expiresAt}
          />
        )}
      </div>
    </section>
  );
}
