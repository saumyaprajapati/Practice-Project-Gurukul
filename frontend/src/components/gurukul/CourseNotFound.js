import Link from "next/link";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// Shown when ?id= doesn't match a course the learner can see (missing,
// malformed, or hidden by RLS — pending/declined courses they don't own).
// Replaces the 404 the server layout used to return before the site became
// a static export.
export default function CourseNotFound() {
  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        <h1 className="heading-2">Course not found</h1>
        <span className="rule-shirorekha" aria-hidden="true" />
        <p className="mt-6 text-charcoal/80">
          This course doesn&apos;t exist, or isn&apos;t available to you.
        </p>
        <p className="mt-4">
          <Link href={GURUKUL_ROUTES.courses} className="font-medium underline underline-offset-4">
            Browse all courses
          </Link>
        </p>
      </div>
    </section>
  );
}
