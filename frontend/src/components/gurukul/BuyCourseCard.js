// Extends the chaitya-arch/surface-earthy pattern already established by
// components/landing/CourseCard.js, for the Buy Courses catalogue's actual
// data shape (price, description, expired-access state). The CTA navigates
// to the Course Detail page, which owns the still-inert purchase/renewal
// action — no payment backend exists yet.
import Link from "next/link";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";
import { formatPrice } from "@/lib/courses/currency";

export default function BuyCourseCard({ course, enrollment }) {
  const { title, description, category, instructor, image, price } = course;
  const initial = title.charAt(0);
  const isExpired = enrollment?.status === "expired";

  return (
    <li className="surface-earthy flex h-full flex-col rounded-lg p-4 shadow-sm transition-shadow hover:shadow-lg">
      <div
        className="relative mx-auto aspect-[4/5] w-32 sm:w-40"
        style={{ clipPath: "url(#chaitya-arch)" }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- thumbnail source is mock data, not a static asset.
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-ochre to-brown">
            <span className="text-3xl font-semibold text-cream">{initial}</span>
          </div>
        )}
      </div>

      <h3 className="mt-4 text-center font-semibold text-charcoal">{title}</h3>
      <p className="mt-1 text-center text-sm text-charcoal/70">
        {category} · {instructor}
      </p>
      <p className="mt-2 text-center text-sm text-charcoal/80">{description}</p>

      {isExpired ? (
        <p className="mt-3 text-center text-sm font-medium text-ochre">Access expired</p>
      ) : null}

      <p className="mt-3 text-center font-semibold text-charcoal">
        {formatPrice(price)}
      </p>

      <Link
        href={GURUKUL_ROUTES.courseDetail(course.id)}
        className="surface-earthy mt-4 block rounded px-4 py-2 text-center text-sm font-medium"
      >
        {isExpired ? "Renew Access" : "View Course"}
      </Link>
    </li>
  );
}
