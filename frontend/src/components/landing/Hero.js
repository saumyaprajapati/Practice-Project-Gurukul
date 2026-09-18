import styles from "./Hero.module.css";
import { ENTER_GURUKUL_HREF, EXPLORE_COURSES_HREF } from "./cta";

export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className={`section-base section-dark relative overflow-hidden ${styles.hero}`}
    >
      <div
        className={`${styles.texture} ${styles.heroAnim} absolute inset-0`}
        aria-hidden="true"
      />

      <svg
        className={`${styles.archSilhouette} absolute inset-x-0 bottom-0 w-full`}
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="none" stroke="var(--brown)" strokeWidth="2" opacity="0.35">
          <path d="M0,400 L0,260 Q60,190 120,260 L120,400" />
          <path d="M120,400 L120,260 Q180,190 240,260 L240,400" />
          <path d="M240,400 L240,260 Q300,190 360,260 L360,400" />
          <path d="M840,400 L840,260 Q900,190 960,260 L960,400" />
          <path d="M960,400 L960,260 Q1020,190 1080,260 L1080,400" />
          <path d="M1080,400 L1080,260 Q1140,190 1200,260 L1200,400" />
          <line x1="60" y1="260" x2="60" y2="400" />
          <line x1="180" y1="260" x2="180" y2="400" />
          <line x1="300" y1="260" x2="300" y2="400" />
          <line x1="900" y1="260" x2="900" y2="400" />
          <line x1="1020" y1="260" x2="1020" y2="400" />
          <line x1="1140" y1="260" x2="1140" y2="400" />
        </g>
      </svg>

      <div
        className={`${styles.glow} ${styles.heroAnim} absolute left-1/2 top-[38%] -translate-x-1/2`}
        aria-hidden="true"
      />

      <svg
        className={`${styles.diya} ${styles.heroAnim} absolute left-1/2 top-[40%] -translate-x-1/2`}
        viewBox="0 0 200 220"
        aria-hidden="true"
        focusable="false"
      >
        <ellipse cx="100" cy="170" rx="70" ry="16" fill="var(--gold)" opacity="0.9" />
        <path
          d="M35,170 Q100,205 165,170 Q150,150 100,150 Q50,150 35,170 Z"
          fill="var(--ochre)"
        />
        <ellipse cx="100" cy="150" rx="42" ry="10" fill="var(--gold)" />
        <g className={`${styles.flame} ${styles.heroAnim}`}>
          <path
            d="M100,150 C88,130 84,108 100,88 C116,108 112,130 100,150 Z"
            fill="var(--gold)"
          />
          <path
            d="M100,140 C94,128 92,114 100,100 C108,114 106,128 100,140 Z"
            fill="#f7dfa0"
          />
        </g>
      </svg>

      <div className="section-inner relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center text-center md:min-h-[80vh] md:text-left">
        <div className="mx-auto max-w-3xl md:mx-0">
          <h1
            id="hero-heading"
            className={`heading-1 ${styles.heroAnim} ${styles.headline}`}
          >
            <span className="block text-cream/90">
              Most online courses teach you.
            </span>
            <span className={`${styles.headlineEmphasis} block`}>
              Gurukul notices you.
            </span>
          </h1>

          <span
            className={`rule-shirorekha ${styles.heroAnim} ${styles.rule} mx-auto md:mx-0`}
            aria-hidden="true"
          />

          <p
            className={`mx-auto mt-6 max-w-xl text-base text-cream/80 sm:text-lg md:mx-0 ${styles.heroAnim} ${styles.copy}`}
          >
            Learn with a platform that remembers your progress, notices when
            you’re stuck, and challenges you when you’re about to give up.
          </p>

          <div
            className={`mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-start ${styles.heroAnim} ${styles.ctas}`}
          >
            <a
              href={ENTER_GURUKUL_HREF}
              className="surface-earthy rounded px-6 py-3 font-medium"
            >
              Enter the Gurukul
            </a>
            <a
              href={EXPLORE_COURSES_HREF}
              className="font-medium text-cream/85 underline underline-offset-4 hover:text-gold"
            >
              Explore Courses
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
