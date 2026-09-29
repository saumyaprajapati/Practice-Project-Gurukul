GURUKUL — LANDING PAGE IMPLEMENTATION DOCUMENT 04
MENTOR SYSTEM

SCOPE
Build the reusable historical mentor presentation system.

REPOSITORY
Work inside frontend/.
Continue JavaScript (.js).
Inspect existing instructions and components before editing.
Do not modify backend/.
Do not redesign unrelated sections.

CORE MESSAGE
“The right voice. At the right moment.”

INITIAL MENTORS
- Arjuna
- Karna
- Babur
- Chanakya
- Gargi
- Ekalavya

1. DATA-DRIVEN DESIGN
Do not create six unrelated components.

Create a reusable mentor data structure with fields such as:
id
name
trigger
purpose
dialogue
languages
artwork
animation

Allow additional mentors later without rewriting MentorCard.

2. SECTION
Heading:
“The right voice. At the right moment.”

Supporting idea:
Gurukul responds to learner behaviour instead of relying only on generic reminders.

3. MENTOR CARD
Each card:
- artwork
- name
- trigger/context
- short dialogue

Example conceptual format:
ARJUNA
When you begin.
[dialogue]

Do not claim any line is a historically authentic quotation unless it has been verified.

4. VISUAL DIRECTION
Characters should feel:
- dignified
- human
- historically inspired
- approachable
- visually consistent

Avoid:
- superhero styling
- villain styling
- caricatures
- excessive religious symbolism
- political/sectarian framing

All characters are mentors/challengers, never villains.

5. TYPOGRAPHY
Anek:
- name
- context
- supporting UI

Tiro Devanagari Sanskrit:
- character dialogue only

Do not use Tiro as the general site font.

6. INTERACTION
Desktop:
- hover/focus can trigger subtle character response
- card can illuminate
- dialogue can appear

Mobile:
- tap to expand
- no hover dependency

Keyboard users must be able to access interactive behaviour.

7. ANIMATION
If Rive is already installed, use it where appropriate for character state machines.
If not installed, first consider whether CSS/SVG is sufficient.
Do not add Rive solely because the original concept mentions it.

Heavy character assets must not all load during initial page load.
Lazy-load/defer non-visible characters where practical.

Static artwork + text must always work as fallback.

8. ACCESSIBILITY
- dialogue is real text
- animation is not required
- focus states
- reduced-motion support
- meaningful labels

9. RESPONSIVE
Desktop: balanced multi-card composition.
Mobile: horizontal scrolling, carousel, or one-card-at-a-time presentation.

Do not make cards too small to read.

10. ACCEPTANCE
- reusable mentor data model
- six mentors supported
- desktop/mobile interaction
- Tiro used only for dialogue
- static fallback
- no villain presentation
- performance-conscious loading

STOP.
