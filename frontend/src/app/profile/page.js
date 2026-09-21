import Link from "next/link";

export const metadata = {
  title: "Your Profile — Gurukul",
};

export default function ProfilePage() {
  return (
    <div className="section-manuscript flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="heading-2">Your Profile</h1>
      <span className="rule-shirorekha" aria-hidden="true" />
      <p className="mt-6 max-w-md text-charcoal/80">
        Your profile is on its way. There&apos;s nothing to see here yet.
      </p>
      <Link href="/" className="mt-8 text-ochre underline underline-offset-4">
        Back to Gurukul
      </Link>
    </div>
  );
}
