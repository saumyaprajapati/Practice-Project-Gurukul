GURUKUL — LANDING PAGE IMPLEMENTATION DOCUMENT 02
HERO SECTION

SCOPE
Implement ONLY the Hero section inside the existing frontend project.

REPOSITORY CONTEXT
The project already exists at:
Practice - Gurukul - 01/frontend/

Use:
frontend/src/app/page.js
and the reusable component structure established by Document 01.

The project currently uses JavaScript (.js). Do not convert to TypeScript.

Before editing:
- inspect frontend/CLAUDE.md
- inspect frontend/AGENTS.md
- inspect frontend/package.json
- inspect the existing foundation from Document 01

Do not modify backend/.

CORE MESSAGE
“Most online courses teach you.
Gurukul notices you.”

Supporting copy:
“Learn with a platform that remembers your progress, notices when you're stuck, and challenges you when you're about to give up.”

PRIMARY CTA
Enter the Gurukul

SECONDARY CTA
Explore Courses

1. INITIAL STATE
The viewport begins predominantly dark:
- deep charcoal/lamp-black background
- subtle Ajanta-inspired texture
- restrained environmental detail
- one visually important diya

No photorealistic temple imagery.
No generic religious stock art.

2. ANIMATION
Sequence:
Darkness
→ diya becomes visible
→ flame ignites
→ light expands
→ subtle learning-space environment appears
→ headline becomes visible
→ CTA becomes interactive

Use CSS/SVG for simple effects.
Use GSAP only if it is already installed or if the repository's dependency policy permits adding it and it materially improves the animation.

Do not add a dependency merely for a simple fade/transform.

The animation must never block the page for a long time.

3. LIGHT
Use restrained warm illumination.
Avoid:
- neon glow
- huge glowing circles
- sci-fi lighting
- excessive particles
- excessive bloom

4. TYPOGRAPHY
Use the Anek typography foundation from Document 01.

H1:
Most online courses teach you.
Gurukul notices you.

Make the second sentence visually prominent without creating excessive decorative styling.

5. CTA
Enter the Gurukul:
Use the existing auth/app route if one exists. Otherwise use the agreed placeholder route from the repository rather than inventing an authentication system.

Explore Courses:
Scroll to the existing Courses section placeholder.

6. ENVIRONMENT
Reveal a stylised learning environment inspired by Indian historical learning spaces/Nalanda-like architecture.

This is atmosphere, not an archaeological reconstruction.

7. RESPONSIVE
Desktop:
- cinematic composition
- diya/environment can occupy substantial visual area
- text remains dominant

Mobile:
- headline and CTA have priority
- simplify artwork
- prevent excessive vertical scrolling before the main message

8. REDUCED MOTION
For prefers-reduced-motion:
- skip elaborate timeline
- show the illuminated/final state quickly
- keep content fully visible

9. PERFORMANCE
- no video background
- optimise hero imagery
- do not load mentor/course/completion assets here
- avoid unnecessary client-side state

10. ACCEPTANCE
- Hero communicates the product in the first viewport.
- Dark-to-light metaphor is clear.
- Diya is the visual anchor.
- CTAs work.
- Mobile works.
- Reduced motion works.
- Existing foundation is preserved.
- No other landing sections are implemented.

STOP.
