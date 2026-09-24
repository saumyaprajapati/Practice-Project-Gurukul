"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCourseById } from "@/lib/courses/courses";
import { apiFetch } from "@/lib/apiClient";
import { formatPrice } from "@/lib/courses/currency";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// A deliberately minimal checkout: an order summary and a single confirm
// button — no fake card-number fields, so this never resembles a real
// payment form. Confirming POSTs to the real checkout route, which writes
// an active enrollment row, then redirects to My Learning, where the
// course now actually appears. No real payment is ever processed anywhere.
export default function CheckoutPage({ params }) {
  const { courseId } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCourseById(courseId).then((fetchedCourse) => {
      if (!cancelled) setCourse(fetchedCourse);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  async function handleCompletePurchase() {
    setIsConfirming(true);
    await apiFetch(`/api/enrollments/${courseId}/checkout`, { method: "POST" });
    router.push(GURUKUL_ROUTES.learning);
  }

  if (!course) return null;

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner max-w-lg">
        <h1 className="heading-2">Confirm Purchase</h1>
        <span className="rule-shirorekha" aria-hidden="true" />

        <div className="surface-earthy mt-8 rounded-lg p-6">
          <p className="text-sm text-charcoal/60">{course.category} · {course.instructor}</p>
          <h2 className="mt-1 text-xl font-semibold text-charcoal">{course.title}</h2>

          <div className="mt-4 flex items-baseline justify-between border-t border-brown/20 pt-4">
            <span className="text-charcoal/70">Total</span>
            <span className="text-2xl font-semibold text-charcoal">{formatPrice(course.price)}</span>
          </div>

          <p className="mt-4 text-xs text-charcoal/50">
            This is a mock checkout for a prototype — no payment is ever processed.
          </p>

          <button
            type="button"
            onClick={handleCompletePurchase}
            disabled={isConfirming}
            className="mt-6 block w-full rounded bg-gold px-4 py-2 text-center text-sm font-medium text-charcoal disabled:opacity-60"
          >
            {isConfirming ? "Processing..." : "Complete Purchase"}
          </button>

          <Link
            href={GURUKUL_ROUTES.courseDetail(courseId)}
            className="mt-3 block text-center text-sm text-charcoal/70 underline"
          >
            Cancel
          </Link>
        </div>
      </div>
    </section>
  );
}
