"use client";

import { useEffect, useMemo, useState } from "react";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import ConfirmButton from "@/components/admin/ConfirmButton";
import StatusBadge from "@/components/admin/StatusBadge";
import { hasActiveAccess } from "@/lib/courses/enrollment";
import {
  getAllEnrollments,
  grantEnrollment,
  revokeEnrollment,
  setEnrollmentExpiry,
  resetProgress,
  deleteEnrollment,
} from "@/lib/admin/enrollments";
import { getAllUsers } from "@/lib/admin/users";
import { getAllCoursesForAdmin } from "@/lib/admin/courses";

const FIELD_CLASS = "rounded border border-brown/40 bg-cream px-3 py-2 text-sm text-charcoal";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

// <input type="date"> value (local calendar day) for an ISO timestamp.
function toDateInput(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function EnrollmentRow({ enrollment, onReload, onError }) {
  const [expiry, setExpiry] = useState(toDateInput(enrollment.expiresAt));
  const [busy, setBusy] = useState(false);
  const isActive = hasActiveAccess(enrollment);

  async function run(action) {
    setBusy(true);
    onError(null);
    try {
      await action();
      await onReload();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const { userId, courseId } = enrollment;

  return (
    <li className="surface-earthy rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-charcoal">{enrollment.courseTitle}</p>
          <p className="text-sm text-charcoal/70">
            {enrollment.userName} · {enrollment.userEmail}
          </p>
          <p className="text-xs text-charcoal/50">
            Since {formatDate(enrollment.purchasedAt)} · {isActive ? "expires" : "ended"} {formatDate(enrollment.expiresAt)} ·{" "}
            {enrollment.progress}% ({enrollment.completedLessons} lesson(s) done)
          </p>
        </div>
        <StatusBadge status={isActive ? "active" : "expired"} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-2">
          <label htmlFor={`expiry-${userId}-${courseId}`} className="text-charcoal/70">
            Expires
          </label>
          <input
            id={`expiry-${userId}-${courseId}`}
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className={FIELD_CLASS}
          />
          <button
            type="button"
            disabled={busy || !expiry || expiry === toDateInput(enrollment.expiresAt)}
            // End of the chosen day, local time.
            onClick={() => run(() => setEnrollmentExpiry(userId, courseId, new Date(`${expiry}T23:59:59`)))}
            className="underline underline-offset-4 disabled:opacity-40"
          >
            Set
          </button>
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => grantEnrollment(userId, courseId, 365))}
          className="underline underline-offset-4 disabled:opacity-50"
        >
          {isActive ? "Renew 1 year" : "Restore 1 year"}
        </button>
        {isActive ? (
          <ConfirmButton disabled={busy} confirmLabel="Revoke access now" onConfirm={() => run(() => revokeEnrollment(userId, courseId))}>
            Revoke
          </ConfirmButton>
        ) : null}
        <ConfirmButton
          disabled={busy || enrollment.completedLessons === 0}
          confirmLabel="Reset progress to 0%"
          onConfirm={() => run(() => resetProgress(userId, courseId))}
        >
          Reset progress
        </ConfirmButton>
        <ConfirmButton disabled={busy} confirmLabel="Delete enrollment + progress" onConfirm={() => run(() => deleteEnrollment(userId, courseId))}>
          Delete
        </ConfirmButton>
      </div>
    </li>
  );
}

function GrantForm({ users, courses, onGranted, onError }) {
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [days, setDays] = useState("365");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    onError(null);
    setBusy(true);
    try {
      await grantEnrollment(userId, courseId, Number(days));
      setCourseId("");
      await onGranted();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-earthy flex flex-wrap items-end gap-4 rounded-lg p-4">
      <div>
        <label htmlFor="grant-user" className="mb-1 block text-sm font-medium">
          User
        </label>
        <select id="grant-user" value={userId} onChange={(e) => setUserId(e.target.value)} className={FIELD_CLASS}>
          <option value="">Pick a user...</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="grant-course" className="mb-1 block text-sm font-medium">
          Course
        </label>
        <select id="grant-course" value={courseId} onChange={(e) => setCourseId(e.target.value)} className={FIELD_CLASS}>
          <option value="">Pick a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.status})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="grant-days" className="mb-1 block text-sm font-medium">
          Days of access
        </label>
        <input
          id="grant-days"
          type="number"
          min="1"
          inputMode="numeric"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className={`${FIELD_CLASS} w-28`}
        />
      </div>
      <AuthButton type="submit" disabled={busy || !userId || !courseId || !(Number(days) >= 1)}>
        {busy ? "Granting..." : "Grant Free Access"}
      </AuthButton>
    </form>
  );
}

// Every learner's access and progress. Guard + tabs: admin/layout.js.
// Arriving from the Users page pre-fills the search (?q=<email>).
export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  // This page only mounts client-side (admin/layout.js renders nothing until
  // the admin check resolves), so the URL can be read directly.
  const [query, setQuery] = useState(() =>
    typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("q") ?? "")
  );
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState(null);

  async function reload() {
    setEnrollments(await getAllEnrollments());
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllEnrollments(), getAllUsers(), getAllCoursesForAdmin()])
      .then(([enrollmentList, userList, courseList]) => {
        if (cancelled) return;
        setEnrollments(enrollmentList);
        setUsers(userList);
        setCourses(courseList);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!enrollments) return [];
    const needle = query.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      const isActive = hasActiveAccess(enrollment);
      return (
        (!courseFilter || enrollment.courseId === courseFilter) &&
        (statusFilter === "all" || (statusFilter === "active") === isActive) &&
        (!needle ||
          [enrollment.userName, enrollment.userEmail, enrollment.courseTitle].some((field) =>
            field?.toLowerCase().includes(needle)
          ))
      );
    });
  }, [enrollments, query, courseFilter, statusFilter]);

  return (
    <>
      <h1 className="heading-2">Enrollments</h1>
      <span className="rule-shirorekha" aria-hidden="true" />

      <h2 className="mt-8 mb-3 font-semibold text-charcoal">Grant access</h2>
      <GrantForm users={users} courses={courses} onGranted={reload} onError={setError} />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          aria-label="Filter by course"
          className={FIELD_CLASS}
        >
          <option value="">All courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className={FIELD_CLASS}
        >
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="expired">Expired / revoked</option>
        </select>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search learner or course..."
          aria-label="Search enrollments"
          className={`${FIELD_CLASS} ml-auto w-full sm:w-72`}
        />
      </div>

      <AuthError message={error} />

      {!enrollments ? null : visible.length === 0 ? (
        <p className="mt-8 text-charcoal/80">No enrollments match.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((enrollment) => (
            <EnrollmentRow
              key={`${enrollment.userId}-${enrollment.courseId}-${enrollment.expiresAt}`}
              enrollment={enrollment}
              onReload={reload}
              onError={setError}
            />
          ))}
        </ul>
      )}
    </>
  );
}
