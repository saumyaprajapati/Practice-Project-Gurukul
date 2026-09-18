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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
