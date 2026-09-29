const FEATURES = [
  "Fast on 4G",
  "Adaptive video",
  "Adaptive animation",
  "Reliable progress",
];

const TIERS = [
  {
    id: "full",
    name: "Full",
    description: "Richer character animation and environmental effects.",
  },
  {
    id: "lite",
    name: "Lite",
    description: "Reduced character/environment animation, simpler transitions.",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Static artwork with lightweight CSS transitions.",
  },
];

export default function Performance() {
  return (
    <section
      id="performance"
      aria-labelledby="performance-heading"
      className="section-base section-manuscript"
    >
      <div className="section-inner">
        <h2 id="performance-heading" className="heading-2">
          Built for a ₹15,000 phone, not a designer&rsquo;s MacBook.
        </h2>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-charcoal/80">
          Gurukul is designed to feel fast on modest hardware and patchy
          connections.
        </p>

        <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
          <div className="mx-auto">
            <div className="aspect-[9/19] w-40 rounded-[2rem] border-4 border-charcoal/80 bg-cream p-3">
              <div className="flex items-center justify-between text-[10px] text-charcoal/70">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  4G
                  <svg viewBox="0 0 16 10" width="14" height="9" aria-hidden="true">
                    <rect x="0" y="6" width="2" height="4" fill="var(--charcoal)" />
                    <rect x="4" y="4" width="2" height="6" fill="var(--charcoal)" />
                    <rect x="8" y="2" width="2" height="8" fill="var(--charcoal)" />
                    <rect x="12" y="0" width="2" height="10" fill="var(--charcoal)" />
                  </svg>
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-brown/30" />
                <div className="h-3 w-full animate-pulse rounded bg-brown/30" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-brown/30" />
              </div>

              <div className="surface-earthy mt-4 rounded-full px-2 py-1 text-center text-[10px]">
                Resume: Lesson 3
              </div>
            </div>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-charcoal">
                <span className="h-1.5 w-1.5 rounded-full bg-ochre" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <li key={tier.id} className="surface-earthy rounded-lg p-4">
              <p className="font-semibold uppercase tracking-wide text-charcoal">
                {tier.name}
              </p>
              <p className="mt-2 text-sm text-charcoal/70">{tier.description}</p>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-xl text-sm text-charcoal/70">
          The content remains available in every tier. When reduced motion is
          enabled, Gurukul uses the minimal visual treatment.
        </p>
      </div>
    </section>
  );
}
