"use client";

import { useEffect, useState } from "react";
import AuthError from "@/components/auth/AuthError";
import StatCard from "@/components/gurukul/StatCard";
import { getAdminStats } from "@/lib/admin/stats";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1 className="heading-2">Admin Dashboard</h1>
      <span className="rule-shirorekha" aria-hidden="true" />
      <p className="mt-6 max-w-xl text-charcoal/80">Everything in Gurukul, in one place.</p>

      <AuthError message={error} />

      {stats ? (
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="mb-3 font-semibold text-charcoal">Needs attention</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="Courses awaiting review"
                value={stats.pendingCourses}
                href={GURUKUL_ROUTES.adminCourses}
                highlight={stats.pendingCourses > 0}
              />
              <StatCard
                label="Deletion requests"
                value={stats.pendingDeletions}
                href={GURUKUL_ROUTES.adminDeletionRequests}
                highlight={stats.pendingDeletions > 0}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-charcoal">Courses</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="All courses" value={stats.courses} href={GURUKUL_ROUTES.adminCourses} />
              <StatCard label="Approved" value={stats.approvedCourses} />
              <StatCard label="Pending" value={stats.pendingCourses} />
              <StatCard label="Declined" value={stats.declinedCourses} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-charcoal">People</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Users" value={stats.users} href={GURUKUL_ROUTES.adminUsers} />
              <StatCard label="Instructors" value={stats.instructors} />
              <StatCard label="Admins" value={stats.admins} />
              <StatCard label="Banned" value={stats.banned} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-charcoal">Learning</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="Active enrollments"
                value={stats.activeEnrollments}
                href={GURUKUL_ROUTES.adminEnrollments}
              />
              <StatCard label="Lessons completed" value={stats.lessonsCompleted} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
