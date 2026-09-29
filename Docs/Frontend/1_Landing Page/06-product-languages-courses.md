GURUKUL — LANDING PAGE IMPLEMENTATION DOCUMENT 06
PRODUCT EXPERIENCE + LANGUAGES + COURSES

SCOPE
Implement only:
1. Product learning experience
2. Language section
3. Course discovery

REPOSITORY
Work inside frontend/.
Use JavaScript (.js), not TypeScript.
Inspect CLAUDE.md, AGENTS.md and package.json.
Do not modify backend/.
Preserve previously implemented sections.

PART 1 — PRODUCT EXPERIENCE

Heading:
“Beautiful outside. Serious underneath.”

Show a realistic learning interface containing:
- video player
- lesson navigation
- progress
- quiz
- notes
- mentor interaction
- resume position

This is a visual product demonstration. Do not build the actual backend learning system here.

Supporting benefits:

RESUME ANYWHERE
Your position is remembered.

LEARN IN YOUR LANGUAGE
English, Hindi, Gujarati, Marathi, Tamil and Bengali.

KEEP MOVING
Your learning experience should remain usable across devices and realistic network conditions.

Do not claim a feature is production-ready if it is only a mockup.

PART 2 — LANGUAGES

Heading:
“A mentor should speak to you in your language.”

Show:
English
Hindi
Gujarati
Marathi
Tamil
Bengali

Use a simple interactive language switcher if practical.

The visual transition can resemble manuscript layers/pages.

Do not pretend placeholder text is final handcrafted localisation.
If final translations are not available, use clearly marked representative/placeholder content internally.

PART 3 — COURSES

Heading:
“Choose what you will master.”

Show a small featured set of course cards.
Do not build a giant marketplace.

Course card:
- course image
- title
- lesson count
- level
- optional CTA

Example:
Python Foundations
18 Lessons
Beginner
[View Course]

Do not invent:
- ratings
- student counts
- prices
- completion rates
- testimonials

Use actual repository data if it exists; otherwise use clearly isolated mock data for the prototype.

CHAITYA ARCH
Course images should use a pointed horseshoe/chaitya-inspired clipping shape.

Implementation options:
- CSS clip-path
- SVG mask
- another maintainable CSS/SVG solution

Choose the simplest maintainable method.

RESPONSIVE
Product mockup:
- desktop wide layout
- believable mobile layout

Courses:
- desktop multi-card
- mobile single-column or horizontal scrolling

Language controls must be touch-friendly.

PERFORMANCE
- lazy-load course imagery
- do not load actual video unless required
- optimise images
- avoid heavy client-side state

ACCEPTANCE
- product looks credible
- language concept is understandable
- course cards fit Gurukul's visual system
- chaitya arch is clear
- no fake claims/data
- mobile works

STOP.
