import Link from "next/link";

// One big number with a label — the admin dashboard and course analytics
// tiles. `live` adds a pulsing dot (for "watching now"-style numbers).
export default function StatCard({ label, value, hint, href, highlight = false, live = false }) {
  const body = (
    <div className={`surface-earthy h-full rounded-lg p-4 ${highlight ? "ring-2 ring-gold" : ""}`}>
      <p className="flex items-center gap-2 text-sm text-charcoal/70">
        {live ? (
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ochre opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ochre" />
          </span>
        ) : null}
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-charcoal">{value}</p>
      {hint ? <p className="mt-1 text-xs text-charcoal/60">{hint}</p> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}
