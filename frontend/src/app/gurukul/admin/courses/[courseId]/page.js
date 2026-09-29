"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthError from "@/components/auth/AuthError";
import ConfirmButton from "@/components/admin/ConfirmButton";
import StatusBadge from "@/components/admin/StatusBadge";
import CourseDetailsForm from "@/components/admin/CourseDetailsForm";
import CurriculumEditor from "@/components/admin/CurriculumEditor";
import { getCourseForAdmin, deleteCourse } from "@/lib/admin/courses";
import { getAllUsers } from "@/lib/admin/users";
import { getCourseCurriculum } from "@/lib/courses/courses";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// Admin editor for any course: details (incl. owner transfer and status),
// full curriculum control, and instant deletion. Guard + tabs: admin/layout.js.
export default function AdminCourseEditPage({ params }) {
  const { courseId } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [users, setUsers] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  const reloadCurriculum = useCallback(async () => {
    setCurriculum(await getCourseCurriculum(courseId));
  }, [courseId]);

  const reloadCourse = useCallback(async () => {
    const data = await getCourseForAdmin(courseId);
    if (!data) setNotFound(true);
    setCourse(data);
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCourseForAdmin(courseId), getCourseCurriculum(courseId), getAllUsers()])
      .then(([courseData, curriculumData, userList]) => {
        if (cancelled) return;
        if (!courseData) setNotFound(true);
        setCourse(courseData);
        setCurriculum(curriculumData);
        setUsers(userList);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  async function handleDelete() {
    try {
      await deleteCourse(courseId);
      router.push(GURUKUL_ROUTES.adminCourses);
    } catch (err) {
      setError(err.message);
    }
  }

  if (notFound) {
    return (
      <>
        <h1 className="heading-2">Course not found</h1>
        <p className="mt-6">
          <Link href={GURUKUL_ROUTES.adminCourses} className="underline underline-offset-4">
            Back to all courses
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-sm">
        <Link href={GURUKUL_ROUTES.adminCourses} className="underline underline-offset-4">
          ← All courses
        </Link>
      </p>

      <AuthError message={error} />

      {course && curriculum ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="heading-2">{course.title}</h1>
            <StatusBadge status={course.status} />
          </div>
          <span className="rule-shirorekha" aria-hidden="true" />
          <p className="mt-4 text-sm text-charcoal/70">
            id: {course.id} · {course.enrollmentCount} enrolled ·{" "}
            <Link href={GURUKUL_ROUTES.courseDetail(course.id)} className="underline underline-offset-4">
              View as learner
            </Link>
          </p>

          <h2 className="mt-8 mb-4 text-xl font-semibold text-charcoal">Details</h2>
          <CourseDetailsForm key={course.id} course={course} users={users} onSaved={reloadCourse} />

          <h2 className="mt-10 mb-4 text-xl font-semibold text-charcoal">Curriculum</h2>
          <CurriculumEditor courseId={course.id} curriculum={curriculum} onChanged={reloadCurriculum} />

          <div className="mt-12 rounded-lg border border-ochre/40 p-4">
            <h2 className="font-semibold text-ochre">Danger zone</h2>
            <p className="mt-1 text-sm text-charcoal/80">
              Deleting removes this course, its curriculum, and every learner&apos;s enrollment and progress. It
              can&apos;t be undone.
            </p>
            <div className="mt-3">
              <ConfirmButton confirmLabel="Delete this course forever" onConfirm={handleDelete}>
                Delete course
              </ConfirmButton>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
