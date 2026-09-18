import Image from "next/image";
import styles from "./MentorCard.module.css";

export default function MentorCard({ mentor }) {
  const { name, trigger, dialogue, artwork } = mentor;
  const initial = name.charAt(0);

  return (
    <details className={`${styles.card} surface-earthy w-full rounded-lg p-6`}>
      <summary
        className={`${styles.summary} flex items-center gap-4 cursor-pointer`}
      >
        {artwork ? (
          <Image
            src={artwork}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 56 56"
            width="56"
            height="56"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle
              cx="28"
              cy="28"
              r="27"
              fill="var(--brown)"
              stroke="var(--gold)"
              strokeWidth="1.5"
            />
            <text
              x="28"
              y="29"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--cream)"
              fontSize="22"
              fontWeight="600"
              fontFamily="var(--font-anek), ui-sans-serif, system-ui, sans-serif"
            >
              {initial}
            </text>
          </svg>
        )}

        <span className="flex-1">
          <span className="block font-semibold uppercase tracking-wide">
            {name}
          </span>
          <span className="block text-sm opacity-70">{trigger}</span>
        </span>

        <span className={styles.indicator} aria-hidden="true" />
      </summary>

      <div className="mt-4 border-l-2 border-ochre pl-4">
        <p className="font-dialogue italic">&ldquo;{dialogue}&rdquo;</p>
      </div>
    </details>
  );
}
