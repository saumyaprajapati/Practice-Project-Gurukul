"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CourseListing from "@/components/gurukul/CourseListing";
import MyLearningCourseCard from "@/components/gurukul/MyLearningCourseCard";
import { getMyLearning } from "@/lib/courses/enrollment";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// Courses the learner currently has active access to. Search only shows up
// past 16 owned courses (Dashboard-2 §"Course search").
export default function MyLearningPage() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyLearning().then(({ items }) => {
      if (!cancelled) setItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) return null;

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        <h1 className="heading-2">Your Learning</h1>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-charcoal/80">Continue your journey.</p>

        <div className="mt-10">
          <CourseListing
            items={items}
            renderCard={({ course, enrollment }) => (
              <MyLearningCourseCard key={course.id} course={course} enrollment={enrollment} />
            )}
            showSearch={items.length > 16}
            searchPlaceholder="Search your courses..."
            emptyState={
              <div className="surface-earthy rounded-lg p-8 text-center">
                <p className="font-semibold text-charcoal">Your learning shelf is empty.</p>
                <p className="mt-2 text-charcoal/80">
                  There are courses waiting beyond the gate.
                </p>
                <Link
                  href={GURUKUL_ROUTES.courses}
                  className="surface-earthy mt-6 inline-block rounded px-6 py-3 font-medium"
                >
                  Explore Courses
                </Link>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
