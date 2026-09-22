// Derives which bucket a course belongs in from Course + Enrollment data,
// per Dashboard-1's ownership-derivation rule. Course/Enrollment stay
// structurally separate inputs — this module is the only place that
// combines them, so the UI never has to.
import { COURSES } from "./courses";
import { getEnrollmentForCourse, hasActiveAccess } from "./enrollment";

// Courses with no active enrollment — never purchased, or previously
// purchased and now expired. Excludes anything the learner currently owns.
export function getPurchasableCourses() {
  return COURSES.map((course) => {
    const enrollment = getEnrollmentForCourse(course.id);
    return { course, enrollment };
  }).filter(({ enrollment }) => !hasActiveAccess(enrollment));
}

// Courses the learner currently has active access to — the inverse of
// getPurchasableCourses(). An expired enrollment does not count, per the
// same derivation rule (it belongs in Buy Courses instead).
export function getMyLearningCourses() {
  return COURSES.map((course) => {
    const enrollment = getEnrollmentForCourse(course.id);
    return { course, enrollment };
  }).filter(({ enrollment }) => hasActiveAccess(enrollment));
}
