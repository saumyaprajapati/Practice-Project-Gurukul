export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="heading-2">{title}</h1>
      {subtitle ? <p className="mt-2 text-charcoal/80">{subtitle}</p> : null}
      <span className="rule-shirorekha" aria-hidden="true" />
    </div>
  );
}
