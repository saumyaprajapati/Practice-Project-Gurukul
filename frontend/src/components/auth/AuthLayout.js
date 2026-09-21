import Link from "next/link";
import styles from "./AuthLayout.module.css";

export default function AuthLayout({ children }) {
  return (
    <div className="section-manuscript flex min-h-full flex-1 flex-col">
      <div className="section-inner flex flex-1 flex-col items-center justify-center py-12 sm:py-16">
        <Link
          href="/"
          className="heading-2 mb-8 text-charcoal hover:text-ochre"
        >
          Gurukul
        </Link>
        <div className={`w-full max-w-md ${styles.shell}`}>{children}</div>
      </div>
    </div>
  );
}
