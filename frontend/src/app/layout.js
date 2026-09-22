import { Anek_Latin, Tiro_Devanagari_Sanskrit } from "next/font/google";
import "./globals.css";

// Primary UI font — variable, covers headings/body/nav/buttons.
const anekLatin = Anek_Latin({
  variable: "--font-anek",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Reserved for future mentor-dialogue UI only — never applied globally.
const tiroDevanagariSanskrit = Tiro_Devanagari_Sanskrit({
  variable: "--font-tiro",
  weight: "400",
  subsets: ["devanagari", "latin"],
  display: "swap",
});

export const metadata = {
  title: "Gurukul",
  description:
    "Gurukul — तमसो मा ज्योतिर्गमय: lead me from darkness to light.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${anekLatin.variable} ${tiroDevanagariSanskrit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Shared chaitya-arch clip shape, used by every course card
            (landing page + Learning Hub) via clipPath: url(#chaitya-arch).
            Defined once, globally, so no page needs its own copy. */}
        <svg width="0" height="0" aria-hidden="true">
          <defs>
            <clipPath id="chaitya-arch" clipPathUnits="objectBoundingBox">
              <path d="M 0.1 1 L 0.1 0.55 C 0.1 0.15 0.25 0 0.5 0 C 0.75 0 0.9 0.15 0.9 0.55 L 0.9 1 Z" />
            </clipPath>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
