"use client";

import { use, useEffect, useState } from "react";
import { getCourseById, getCourseCurriculum } from "@/lib/courses/courses";
import { getEnrollmentForCourse, hasActiveAccess } from "@/lib/courses/enrollment";
import { getLessonProgress } from "@/lib/courses/progress";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";
import Link from "next/link";
import CourseHero from "@/components/gurukul/course-detail/CourseHero";
import CourseOverview from "@/components/gurukul/course-detail/CourseOverview";
import CourseLearningExperience from "@/components/gurukul/course-detail/CourseLearningExperience";

// A single route serving both Course Detail states: a browsable overview
// with a locked syllabus for courses you don't have active access to
// (never purchased, or expired — both grouped the same way
// courses/purchasable already does), and the full interactive lesson
// experience for courses you own. Both BuyCourseCard and
// MyLearningCourseCard link here. The existence check/404 and per-course
// <title> live in the sibling layout.js (a Server Component) — this page
// is a Client Component so it can fetch the caller's real enrollment state.
export default function CourseDetailPage({ params }) {
  const { courseId } = use(params);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCourseById(courseId),
      getEnrollmentForCourse(courseId),
      getLessonProgress(courseId),
      getCourseCurriculum(courseId),
      getCurrentUserProfile().catch(() => null),
    ]).then(([course, enrollment, completedLessonIds, curriculum, profile]) => {
      if (!cancelled) {
        setData({ course, enrollment, completedLessonIds, curriculum, isAdmin: Boolean(profile?.isAdmin) });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!data) return null;

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
