"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthError from "@/components/auth/AuthError";
import ConfirmButton from "@/components/admin/ConfirmButton";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/courses/currency";
import { getAllCoursesForAdmin, approveCourse, declineCourse, deleteCourse } from "@/lib/admin/courses";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

const FILTERS = ["all", "pending", "approved", "declined"];

// Every course at any status. Pending ones get quick Approve/Decline; any
// course can be edited or deleted outright. Guard + tabs: admin/layout.js.
export default function AdminCoursesPage() {
  const [courses, setCourses] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAllCoursesForAdmin()
      .then((data) => {
        if (cancelled) return;
        setCourses(data);
        // Land on "All" when nothing is waiting for review.
        if (!data.some((course) => course.status === "pending")) setFilter("all");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!courses) return [];
    const needle = query.trim().toLowerCase();
    return courses.filter(
      (course) =>
        (filter === "all" || course.status === filter) &&
        (!needle ||
          [course.title, course.instructor, course.category, course.id].some((field) =>
            field?.toLowerCase().includes(needle)
          ))
    );
  }, [courses, filter, query]);

  async function run(courseId, action, update) {
    setBusyId(courseId);
    setError(null);
    try {
      await action(courseId);
      setCourses(update);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function setStatus(courseId, status) {
    return (prev) => prev.map((course) => (course.id === courseId ? { ...course, status } : course));
  }

  return (
    <>
      <h1 className="heading-2">Courses</h1>
      <span className="rule-shirorekha" aria-hidden="true" />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {FILTERS.map((value) => {
          const count = courses ? courses.filter((course) => value === "all" || course.status === value).length : 0;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded px-3 py-1.5 text-sm font-medium capitalize ${
                filter === value ? "bg-gold text-charcoal" : "surface-earthy"
              }`}
            >
              {value} ({count})
            </button>
          );
        })}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, instructor, category..."
          aria-label="Search courses"
          className="ml-auto w-full rounded border border-brown/40 bg-cream px-3 py-2 text-sm text-charcoal sm:w-72"
        />
      </div>

      <AuthError message={error} />

      {!courses ? null : visible.length === 0 ? (
        <p className="mt-8 text-charcoal/80">No courses match.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((course) => (
            <li key={course.id} className="surface-earthy rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-charcoal">{course.title}</h2>
                  <p className="text-sm text-charcoal/70">
                    {course.category} · {course.instructor} · {formatPrice(course.price)} ·{" "}
                    {course.enrollmentCount} enrolled
                  </p>
                  <p className="text-xs text-charcoal/50">
                    Owner:{" "}
                    {course.ownerId ? (
                      <Link href={GURUKUL_ROUTES.adminUserProfile(course.ownerId)} className="underline underline-offset-4">
                        {course.ownerName ?? "unknown"}
                      </Link>
                    ) : (
                      "none"
                    )}{" "}
                    · id: {course.id}
                  </p>
                </div>
                <StatusBadge status={course.status} />
              </div>
              <p className="mt-2 text-sm text-charcoal/80">{course.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <Link href={GURUKUL_ROUTES.adminCourseEdit(course.id)} className="font-medium underline underline-offset-4">
                  Edit
                </Link>
                <Link href={GURUKUL_ROUTES.courseDetail(course.id)} className="underline underline-offset-4">
                  View
                </Link>
                {course.status !== "approved" ? (
                  <button
                    type="button"
                    disabled={busyId === course.id}
                    onClick={() => run(course.id, approveCourse, setStatus(course.id, "approved"))}
                    className="underline underline-offset-4 disabled:opacity-50"
                  >
                    Approve
                  </button>
                ) : null}
                {course.status !== "declined" ? (
                  <button
                    type="button"
                    disabled={busyId === course.id}
                    onClick={() => run(course.id, declineCourse, setStatus(course.id, "declined"))}
                    className="underline underline-offset-4 disabled:opacity-50"
                  >
                    Decline
                  </button>
                ) : null}
                <ConfirmButton
                  disabled={busyId === course.id}
                  confirmLabel="Delete forever"
                  onConfirm={() =>
                    run(course.id, deleteCourse, (prev) => prev.filter((item) => item.id !== course.id))
                  }
                >
                  Delete
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
