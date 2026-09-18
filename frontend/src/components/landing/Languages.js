import LanguageSwitcher from "./LanguageSwitcher";

// Representative placeholder strings demonstrating script support only —
// not final, professionally reviewed localisation copy.
const LANGUAGES = [
  { code: "en", name: "English", native: "English", greeting: "Welcome" },
  { code: "hi", name: "Hindi", native: "हिन्दी", greeting: "स्वागत है" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", greeting: "સ્વાગત છે" },
  { code: "mr", name: "Marathi", native: "मराठी", greeting: "स्वागत आहे" },
  { code: "ta", name: "Tamil", native: "தமிழ்", greeting: "வணக்கம்" },
  { code: "bn", name: "Bengali", native: "বাংলা", greeting: "স্বাগতম" },
];

export default function Languages() {
  return (
    <section
      id="languages"
      aria-labelledby="languages-heading"
      className="section-base section-manuscript"
    >
      <div className="section-inner">
        <h2 id="languages-heading" className="heading-2">
          A mentor should speak to you in your language.
        </h2>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-charcoal/80">
          The same guidance, offered in the language you think in.
        </p>

        <LanguageSwitcher languages={LANGUAGES} />
      </div>
    </section>
  );
}
