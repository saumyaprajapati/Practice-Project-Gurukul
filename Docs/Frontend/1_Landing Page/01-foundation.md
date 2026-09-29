GURUKUL — LANDING PAGE IMPLEMENTATION DOCUMENT 01
FOUNDATION

SCOPE
Build only the landing-page foundation inside the EXISTING repository. Do not rebuild the Next.js project and do not implement detailed landing-page sections yet.

CURRENT REPOSITORY CONTEXT
Repository root:
Practice - Gurukul - 01/

backend/
  .env
  .gitignore
  package.json
  package-lock.json
  server.js
  node_modules/

frontend/
  AGENTS.md
  CLAUDE.md
  README.md
  eslint.config.mjs
  jsconfig.json
  next.config.mjs
  postcss.config.mjs
  package.json
  package-lock.json
  public/
  src/
    app/
      favicon.ico
      globals.css
      layout.js
      page.js
  .next/
  node_modules/

Docs/
  Feature-1.md
  Project_Idea.md

IMPORTANT REPOSITORY RULES
1. Work inside frontend/ for the landing page.
2. The frontend is already a Next.js application using JavaScript (.js), not TypeScript. Continue using JavaScript unless the existing repository explicitly requires otherwise.
3. Do not convert the project from JavaScript to TypeScript.
4. Do not recreate package.json, package-lock.json, next.config.mjs, or the Next.js app from scratch.
5. Inspect frontend/CLAUDE.md and frontend/AGENTS.md before editing anything and follow their instructions.
6. Inspect the existing frontend/package.json before deciding whether a dependency already exists.
7. Do not install a dependency if the required capability can be implemented with existing tools.
8. Do not modify backend/ for this landing-page task.
9. Do not modify Docs/ unless explicitly required.
10. Do not touch .next/ or node_modules/.
11. Preserve existing working configuration.

OBJECTIVE
Establish a clean, reusable landing-page foundation for Gurukul.

The landing page's visual metaphor:
“तमसो मा ज्योतिर्गमय — lead me from darkness to light.”

PAGE SECTIONS
Create stable placeholders/containers for:
1. Hero
2. Problem
3. Platform Notices You
4. Mentors
5. Progress
6. Learning Experience
7. Languages
8. Courses
9. Performance
10. Completion
11. Final CTA
12. Footer

Do not implement detailed section behaviour yet.

SUGGESTED STRUCTURE
Use the existing frontend/src/app/page.js as the entry point.

If reusable components are needed, create:
frontend/src/components/landing/

Possible files:
components/landing/LandingPage.js
components/landing/Navbar.js
components/landing/Footer.js
components/landing/SectionPlaceholder.js

This is a suggested structure, not a rigid requirement. Follow existing repository conventions if present.

It is completely acceptable and expected for new folders such as:
frontend/src/components/
frontend/src/components/landing/
to be created during implementation. Their existence does NOT negatively affect Next.js or the project. Keep them organised and purposeful.

DESIGN TOKENS
Prepare reusable CSS variables/classes for:
- deep charcoal/lamp black
- red ochre
- turmeric/gold
- manuscript/palm-leaf cream
- earthy brown
- restrained lapis accent

Avoid:
- bright SaaS blue
- neon gradients
- excessive saffron
- excessive gold
- generic purple gradients
- dominant glassmorphism

TYPOGRAPHY
Primary: Anek.
Use for headings, body, navigation, buttons and UI.

Historical dialogue: Tiro Devanagari Sanskrit.
Do not globally apply it. Future mentor dialogue will use it.

If fonts are not already available locally, use the least intrusive project-compatible loading method. Do not add unnecessary font weights.

VISUAL LANGUAGE
Prepare reusable styling for:
- dark sections
- light manuscript sections
- section spacing
- heading hierarchy
- gold horizontal rule inspired by shirorekha
- restrained earthy surfaces

Do not implement detailed chaitya-arch course cards yet.

NAVIGATION
Desktop:
GURUKUL
Courses
How It Works
Mentors
About
[Enter the Gurukul]

Mobile:
GURUKUL
menu button

Navigation should be semantic and keyboard accessible.

CTA behaviour:
- Explore/navigation links should use section anchors where applicable.
- Enter the Gurukul should use an existing auth/app route if one exists.
- Do not invent authentication.

RESPONSIVE
Mobile-first.
Support phones, tablets, laptops and large desktops.
Do not create a desktop-only structure that will later need to be rewritten.

ACCESSIBILITY
Implement:
- semantic HTML
- one H1 reserved for the future Hero
- logical section headings
- visible focus states
- keyboard navigation
- sufficient contrast
- accessible mobile menu
- reduced-motion foundation where appropriate

PERFORMANCE
- Avoid unnecessary client components.
- Do not add GSAP/Rive merely for the foundation.
- Do not load future character assets.
- Use Next.js image/font capabilities appropriately if needed.

ACCEPTANCE
- Existing Next.js app still runs.
- page.js renders the Gurukul landing-page shell.
- Navigation exists.
- Design tokens exist.
- Typography foundation exists.
- Section placeholders have stable IDs.
- Responsive foundation works.
- No detailed future animation/features are implemented.
- Backend remains untouched.

STOP AFTER THIS DOCUMENT.
