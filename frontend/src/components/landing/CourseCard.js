import Image from "next/image";
import { ENTER_GURUKUL_HREF } from "./cta";

export default function CourseCard({ course }) {
  const { title, lessons, level, image } = course;
  const initial = title.charAt(0);

  return (
    <div className="surface-earthy flex h-full flex-col rounded-lg p-4 shadow-sm transition-shadow hover:shadow-lg">
      <div
        className="relative mx-auto aspect-[4/5] w-32 sm:w-40"
        style={{ clipPath: "url(#chaitya-arch)" }}
      >
        {image ? (
          <Image src={image} alt="" fill loading="lazy" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-ochre to-brown">
            <span className="text-3xl font-semibold text-cream">{initial}</span>
          </div>
        )}
      </div>

      <h3 className="mt-4 text-center font-semibold text-charcoal">{title}</h3>
      <p className="mt-1 text-center text-sm text-charcoal/70">
        {lessons} Lessons · {level}
      </p>

      <a
        href={ENTER_GURUKUL_HREF}
        className="surface-earthy mt-4 block rounded px-4 py-2 text-center text-sm font-medium"
      >
        View Course
      </a>
    </div>
  );
}
