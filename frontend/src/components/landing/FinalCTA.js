import Link from "next/link";
import { ENTER_GURUKUL_HREF } from "./cta";

export default function FinalCTA() {
  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      className="section-base section-manuscript"
    >
      <div className="section-inner text-center">
        <h2 id="final-cta-heading" className="heading-2">
          Begin your first course.
        </h2>
        <span className="rule-shirorekha mx-auto" aria-hidden="true" />

        <p className="mt-6 text-charcoal/80">The path starts with one lesson.</p>

        <Link
          href={ENTER_GURUKUL_HREF}
          className="surface-earthy mt-8 inline-block rounded px-8 py-4 text-lg font-semibold"
        >
          Enter the Gurukul
        </Link>
      </div>
    </section>
  );
}
