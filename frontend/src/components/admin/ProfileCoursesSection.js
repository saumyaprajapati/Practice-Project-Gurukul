"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/courses/currency";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// Declined courses only show under "All".
const TABS = [
  { value: "all", label: "All", test: () => true, empty: "No courses uploaded yet." },
  { value: "approved", label: "Approved", test: (course) => course.status === "approved", empty: "No approved courses yet." },
  { value: "pending", label: "Pending approval", test: (course) => course.status === "pending", empty: "No courses pending approval." },
];

// "Courses uploaded" on the admin profile page: tabs straight under the
// heading, or a single message when the user hasn't uploaded anything.
export default function ProfileCoursesSection({ courses }) {
  const [tab, setTab] = useState("all");
  const active = TABS.find((item) => item.value === tab);
  const visible = courses.filter(active.test);

  return (
    <section aria-labelledby="courses-uploaded-heading">
      <h2 id="courses-uploaded-heading" className="text-xl font-semibold text-charcoal">
        Courses uploaded
      </h2>

      {courses.length === 0 ? (
        <p className="mt-4 text-charcoal/80">No courses uploaded yet.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter uploaded courses">
            {TABS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                aria-pressed={tab === item.value}
                className={`rounded px-3 py-1.5 text-sm font-medium ${tab === item.value ? "bg-gold text-charcoal" : "surface-earthy"}`}
              >
                {item.label} ({courses.filter(item.test).length})
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="mt-4 text-charcoal/80">{active.empty}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {visible.map((course) => (
                <li key={course.id} className="surface-earthy rounded-lg p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-charcoal">{course.title}</h3>
                      <p className="text-sm text-charcoal/70">
                        {course.category} · {formatPrice(course.price)} · {course.enrollmentCount} enrolled
                      </p>
                    </div>
                    <StatusBadge status={course.status} label={course.status === "pending" ? "Pending approval" : course.status} />
                  </div>
                  <p className="mt-2 text-sm text-charcoal/80">{course.description}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <Link href={GURUKUL_ROUTES.courseDetail(course.id)} className="underline underline-offset-4">
                      View
                    </Link>
                    <Link href={GURUKUL_ROUTES.adminCourseEdit(course.id)} className="font-medium underline underline-offset-4">
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
