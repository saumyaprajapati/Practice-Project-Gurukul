import Link from "next/link";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

export const metadata = {
  title: "Gurukul — Learning Hub",
};

// The Hub shell/home. Per Dashboard-1 scope: no course data here yet — this
// is the first light/manuscript surface the learner reaches after the dark
// landing page (Dashboard-0 §12), a quiet doorway into My Learning / Buy
// Courses rather than a dashboard of statistics.
export default function GurukulHomePage() {
  return (
    <section className="section-manuscript flex min-h-full flex-1 items-center">
      <div className="section-inner text-center">
        <h1 className="heading-2">You have entered the Gurukul.</h1>
        <span className="mx-auto rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl mx-auto text-charcoal/80">
          Continue where you left off, or find something new to begin.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={GURUKUL_ROUTES.learning}
            className="surface-earthy rounded px-6 py-3 font-medium"
          >
            My Learning
          </Link>
          <Link
            href={GURUKUL_ROUTES.courses}
            className="surface-earthy rounded px-6 py-3 font-medium"
          >
            Buy Courses
          </Link>
        </div>
      </div>
    </section>
  );
}
