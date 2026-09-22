"use client";

import { use } from "react";
import { getCourseById } from "@/lib/courses/courses";
import { getEnrollmentForCourse, hasActiveAccess } from "@/lib/courses/enrollment";
import { getCurriculumForCourse } from "@/lib/courses/curriculum";
import { useOverrides } from "@/lib/courses/enrollmentStore";
import CourseHero from "@/components/gurukul/course-detail/CourseHero";
import CourseOverview from "@/components/gurukul/course-detail/CourseOverview";
import CourseLearningExperience from "@/components/gurukul/course-detail/CourseLearningExperience";

// A single route serving both Course Detail states: a browsable overview
// with a locked syllabus for courses you don't have active access to
// (never purchased, or expired — both grouped the same way
// getPurchasableCourses() already does), and the full interactive lesson
// experience for courses you own. Both BuyCourseCard and
// MyLearningCourseCard link here. The existence check/404 and per-course
// <title> live in the sibling layout.js (a Server Component) — this page
// is a Client Component so it can read localStorage-backed enrollment
// overrides via useOverrides().
export default function CourseDetailPage({ params }) {
  const { courseId } = use(params);
  const course = getCourseById(courseId);
  const curriculum = getCurriculumForCourse(course);

  // Gated on `ready`, not just cosmetic: CourseLearningExperience seeds its
  // completed-lesson state exactly once from initialProgress at mount, so
  // rendering it even one frame early with stale (empty) overrides would
  // seed a freshly-purchased course as "0%, lesson 1" permanently.
  const { overrides, ready } = useOverrides();
  if (!ready) return null;

  const enrollment = getEnrollmentForCourse(courseId, overrides);
  const hasAccess = hasActiveAccess(enrollment);
  const isExpired = enrollment?.status === "expired";

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        <CourseHero course={course} />

        {hasAccess ? (
          <CourseLearningExperience curriculum={curriculum} initialProgress={enrollment.progress} />
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
