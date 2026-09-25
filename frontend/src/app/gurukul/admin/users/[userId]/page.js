"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import AuthError from "@/components/auth/AuthError";
import StatusBadge from "@/components/admin/StatusBadge";
import ProfileCoursesSection from "@/components/admin/ProfileCoursesSection";
import ProfileEnrollmentsSection from "@/components/admin/ProfileEnrollmentsSection";
import { getUserForAdmin } from "@/lib/admin/users";
import { getCoursesOwnedBy } from "@/lib/admin/courses";
import { getEnrollmentsForUser } from "@/lib/admin/enrollments";
import { useAdminProfile } from "@/lib/admin/guard";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "never";
}

// Admin-only view of one user: who they are, the courses they uploaded
// (All / Approved / Pending approval) and the courses they're enrolled in.
// Guard + tabs: admin/layout.js.
export default function AdminUserProfilePage({ params }) {
  const { userId } = use(params);
  const admin = useAdminProfile();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getUserForAdmin(userId), getCoursesOwnedBy(userId), getEnrollmentsForUser(userId)])
      .then(([user, courses, enrollments]) => {
        if (!cancelled) setData({ user, courses, enrollments });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const backLink = (
    <p className="text-sm">
      <Link href={GURUKUL_ROUTES.adminUsers} className="underline underline-offset-4">
        ← All users
      </Link>
    </p>
  );

  if (error) {
    return (
      <>
        {backLink}
        <AuthError message={error} />
      </>
    );
  }

  if (!data) return backLink;

  const { user, courses, enrollments } = data;

  if (!user) {
    return (
      <>
        {backLink}
        <h1 className="heading-2 mt-4">User not found</h1>
        <p className="mt-4 text-charcoal/80">This account doesn&apos;t exist or has been deleted.</p>
      </>
    );
  }

  const searchQuery = `?q=${encodeURIComponent(user.email)}`;

  return (
    <>
      {backLink}

      <div className="surface-earthy mt-4 rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="heading-2">{user.name}</h1>
            <p className="mt-1 text-charcoal/70">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {user.isAdmin ? <StatusBadge status="admin" /> : null}
            {user.isInstructor ? <StatusBadge status="instructor" /> : null}
            {user.isBanned ? <StatusBadge status="banned" /> : null}
            {!user.isAdmin && !user.isInstructor ? <StatusBadge status="learner" label="Learner" /> : null}
          </div>
        </div>

        <p className="mt-3 text-sm text-charcoal/60">
          Joined {formatDate(user.createdAt)} · last sign-in {formatDate(user.lastSignInAt)}
          {user.emailConfirmed ? "" : " · email not verified"}
          {user.id === admin?.id ? " · this is you" : ""}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href={`${GURUKUL_ROUTES.adminUsers}${searchQuery}`} className="underline underline-offset-4">
            Manage roles &amp; ban
          </Link>
          <Link href={`${GURUKUL_ROUTES.adminEnrollments}${searchQuery}`} className="underline underline-offset-4">
            Manage enrollments
          </Link>
        </div>
      </div>

      <div className="mt-10 space-y-12">
        <ProfileCoursesSection courses={courses} />
        <ProfileEnrollmentsSection enrollments={enrollments} />
      </div>
    </>
  );
}
