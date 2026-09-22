// Shared header for both Course Detail states (overview and enrolled),
// same chaitya-arch/surface-earthy motif as the catalogue cards, sized up.
export default function CourseHero({ course }) {
  const { title, description, category, instructor, image } = course;
  const initial = title.charAt(0);

  return (
    <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
      <div
        className="relative w-40 shrink-0 aspect-[4/5] sm:w-48"
        style={{ clipPath: "url(#chaitya-arch)" }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- thumbnail source is mock data, not a static asset.
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-ochre to-brown">
            <span className="text-4xl font-semibold text-cream">{initial}</span>
          </div>
        )}
      </div>

      <div>
        <h1 className="heading-2">{title}</h1>
        <span className="rule-shirorekha mx-auto sm:mx-0" aria-hidden="true" />
        <p className="mt-3 text-sm text-charcoal/70">
          {category} · {instructor}
        </p>
        <p className="mt-4 max-w-2xl text-charcoal/80">{description}</p>
      </div>
    </div>
  );
}
