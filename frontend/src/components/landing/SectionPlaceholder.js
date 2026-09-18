export default function SectionPlaceholder({
  id,
  title,
  headingLevel = 2,
  variant = "manuscript",
  children,
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const headingClass = headingLevel === 1 ? "heading-1" : "heading-2";
  const variantClass =
    variant === "dark" ? "section-dark" : "section-manuscript";

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`section-base ${variantClass}`}
    >
      <div className="section-inner">
        <Heading id={`${id}-heading`} className={headingClass}>
          {title}
        </Heading>
        <span className="rule-shirorekha" aria-hidden="true" />
        <p className="mt-6 text-sm uppercase tracking-wide opacity-60">
          Section placeholder — content coming soon
        </p>
        {children}
      </div>
    </section>
  );
}
