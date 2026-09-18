import Navbar from "./Navbar";
import Hero from "./Hero";
import Problem from "./Problem";
import PlatformNoticesYou from "./PlatformNoticesYou";
import Mentors from "./Mentors";
import Footer from "./Footer";
import SectionPlaceholder from "./SectionPlaceholder";

const SECTIONS = [
  { id: "progress", title: "Progress", variant: "manuscript" },
  { id: "learning-experience", title: "Learning Experience", variant: "dark" },
  { id: "languages", title: "Languages", variant: "manuscript" },
  { id: "courses", title: "Courses", variant: "dark" },
  { id: "performance", title: "Performance", variant: "manuscript" },
  { id: "completion", title: "Completion", variant: "manuscript" },
  { id: "final-cta", title: "Final CTA", variant: "manuscript" },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Hero />
        <Problem />
        <PlatformNoticesYou />
        <Mentors />
        {SECTIONS.map(({ id, title, headingLevel, variant }) => (
          <SectionPlaceholder
            key={id}
            id={id}
            title={title}
            headingLevel={headingLevel}
            variant={variant}
          />
        ))}
      </main>
      <Footer />
    </>
  );
}
