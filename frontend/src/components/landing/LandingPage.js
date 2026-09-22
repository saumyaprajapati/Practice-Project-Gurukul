"use client";

import { useEffect, useState } from "react";
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
import { isAuthenticated, logout } from "@/lib/auth/session";

export default function LandingPage() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isAuthenticated().then((authed) => {
      if (!cancelled) setIsAuthed(authed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    await logout();
    setIsAuthed(false);
  }

  return (
    <>
      <Navbar isAuthed={isAuthed} onSignOut={handleSignOut} />
      <main id="main-content" className="flex-1">
        <Hero isAuthed={isAuthed} />
        <Problem />
        <PlatformNoticesYou />
        <Mentors />
        <Progress />
        <ProductExperience />
        <Languages />
        <Courses />
        <Performance />
        <Completion />
        <FinalCTA isAuthed={isAuthed} />
      </main>
      <Footer />
    </>
  );
}
