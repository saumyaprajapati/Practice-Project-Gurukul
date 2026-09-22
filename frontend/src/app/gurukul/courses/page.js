"use client";

import CourseListing from "@/components/gurukul/CourseListing";
import BuyCourseCard from "@/components/gurukul/BuyCourseCard";
import { getPurchasableCourses } from "@/lib/courses/derive";
import { useOverrides } from "@/lib/courses/enrollmentStore";

// Courses the learner can purchase: never-owned courses and courses whose
// access has expired. Actively-owned courses are excluded — they belong in
// My Learning instead. Search is always visible here (Dashboard-2
// §"Course search"); pagination is now handled by CourseListing.
//
// This page needs "use client" (and so drops its own metadata export, the
// same tradeoff the existing auth/login and auth/signup pages already
// make) because CourseListing owns interactive query/page state and Next.js
// won't let a Server Component pass a render-function prop into it.
export default function BuyCoursesPage() {
  const { overrides } = useOverrides();
  const purchasable = getPurchasableCourses(overrides);

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        <h1 className="heading-2">Buy Courses</h1>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-charcoal/80">
          Everything you haven&apos;t started yet — and anything waiting for you to come back.
        </p>

        <div className="mt-10">
          <CourseListing
            items={purchasable}
            renderCard={({ course, enrollment }) => (
              <BuyCourseCard key={course.id} course={course} enrollment={enrollment} />
            )}
            showSearch
            searchPlaceholder="Search courses..."
            emptyState={
              <div className="surface-earthy rounded-lg p-8 text-center">
                <p className="text-charcoal/80">There&apos;s nothing to browse yet.</p>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
