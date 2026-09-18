import Navbar from "./Navbar";
import Footer from "./Footer";
import SectionPlaceholder from "./SectionPlaceholder";

const SECTIONS = [
  { id: "hero", title: "Hero", headingLevel: 1, variant: "dark" },
  { id: "problem", title: "Problem", variant: "dark" },
  {
    id: "platform-notices-you",
    title: "Platform Notices You",
    variant: "manuscript",
  },
  { id: "mentors", title: "Mentors", variant: "dark" },
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
