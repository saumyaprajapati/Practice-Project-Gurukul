import Navbar from "./Navbar";
import Hero from "./Hero";
import Problem from "./Problem";
import PlatformNoticesYou from "./PlatformNoticesYou";
import Mentors from "./Mentors";
import Progress from "./Progress";
import ProductExperience from "./ProductExperience";
import Languages from "./Languages";
import Courses from "./Courses";
import Performance from "./Performance";
import Completion from "./Completion";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Hero />
        <Problem />
        <PlatformNoticesYou />
        <Mentors />
        <Progress />
        <ProductExperience />
        <Languages />
        <Courses />
        <Performance />
        <Completion />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
