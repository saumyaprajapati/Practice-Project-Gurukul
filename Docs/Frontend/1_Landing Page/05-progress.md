GURUKUL — LANDING PAGE IMPLEMENTATION DOCUMENT 05
PROGRESS AS ILLUMINATION

SCOPE
Implement only the progress/illumination section.

REPOSITORY
Work inside frontend/.
Use existing JavaScript structure.
Inspect repository instructions first.
Do not modify backend/.
Do not redesign earlier sections.

CORE MESSAGE
“Progress you can feel.”

1. VISUAL
Start with a dark wall containing a sequence of diyas.

Initial:
○ ○ ○ ○ ○ ○ ○

Then progressively:
● ○ ○ ○ ○ ○ ○
● ● ○ ○ ○ ○ ○
● ● ● ○ ○ ○ ○
...
● ● ● ● ● ● ●

Use the simplest appropriate technology:
- CSS/SVG preferred
- GSAP if useful for scroll choreography

2. MILESTONES
Visual states can represent:
- lesson completed
- quiz passed
- streak maintained
- milestone reached
- course completed

These are landing-page demonstrations, not proof that every feature already exists in production.

3. ENVIRONMENT
As more diyas illuminate:
- subtle wall details become visible
- the surrounding learning environment becomes brighter
- the final state suggests an illuminated shala

Do not overdo glow.

4. SCROLL
Scroll should influence the sequence without trapping the user.

Avoid excessively long pinned sections.

Mobile should use a simplified sequence if necessary.

5. REDUCED MOTION
Show a simpler state progression.
Do not run elaborate scroll animation.

6. PERFORMANCE
- avoid dozens of independent animation loops
- avoid unnecessary canvas/WebGL
- keep DOM structure reasonable
- animate transform/opacity where practical

7. ACCESSIBILITY
Milestone descriptions must be readable as text.
Do not rely on lit/unlit icons alone.

8. ACCEPTANCE
- progress clearly creates illumination
- visual metaphor is understandable
- scrolling remains natural
- mobile works
- reduced motion works
- no unnecessary heavy animation

STOP.
