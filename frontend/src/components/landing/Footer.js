import { ENTER_GURUKUL_HREF } from "./cta";
import styles from "./Footer.module.css";

const LEARN_LINKS = [
  { label: "Courses", href: "#courses" },
  { label: "Mentors", href: "#mentors" },
  { label: "Languages", href: "#languages" },
  { label: "Progress", href: "#progress" },
];

const GURUKUL_LINKS = [
  { label: "About", href: "#problem" },
  { label: "How It Works", href: "#learning-experience" },
  { label: "Performance", href: "#performance" },
  { label: "Enter the Gurukul", href: ENTER_GURUKUL_HREF },
];

function FooterNavColumn({ title, links }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-gold">
        {title}
      </p>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-sm text-cream/80 hover:text-cream">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="footer" className="section-base section-dark relative overflow-hidden">
      <div className={`${styles.texture} absolute inset-0`} aria-hidden="true" />

      <div className="section-inner relative z-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 40 44" width="24" height="26" aria-hidden="true">
                <ellipse cx="20" cy="36" rx="14" ry="4" fill="var(--gold)" opacity="0.9" />
                <path d="M7,36 Q20,44 33,36 Q29,30 20,30 Q11,30 7,36 Z" fill="var(--ochre)" />
                <path d="M20,30 C15,22 14,14 20,6 C26,14 25,22 20,30 Z" fill="var(--gold)" />
              </svg>
              <p className="font-semibold tracking-wide">GURUKUL</p>
            </div>

            <p className="font-dialogue mt-4 text-sm text-cream/80">
              तमसो मा ज्योतिर्गमय
            </p>
            <p className="mt-1 text-sm text-cream/70">
              Lead me from darkness to light.
            </p>
          </div>

          <FooterNavColumn title="Learn" links={LEARN_LINKS} />
          <FooterNavColumn title="Gurukul" links={GURUKUL_LINKS} />
        </div>

        <div className="mt-10 border-t border-cream/10 pt-6">
          <p className="text-sm text-cream/60">
            © {new Date().getFullYear()} Gurukul.
          </p>
        </div>
      </div>
    </footer>
  );
}
