GURUKUL — LANDING PAGE IMPLEMENTATION DOCUMENT 03
PROBLEM + PLATFORM NOTICES YOU

SCOPE
Implement only the Problem section and the “What if the platform noticed?” learner journey.

REPOSITORY
Work only inside frontend/.
Use the existing Next.js JavaScript structure.
Inspect CLAUDE.md, AGENTS.md and existing components first.
Do not convert to TypeScript.
Do not modify backend/.

1. PROBLEM

Heading:
“Online learning forgot the learner.”

Show a visual journey:
ENROL
↓
WATCH
↓
MISS A LESSON
↓
FALL BEHIND
↓
STOP

The visual should start more visible and progressively become darker.

Supporting concept:
“You don't stop learning because the next video disappeared. You stop because nobody noticed when you disappeared.”

Do not add statistics unless actual sourced data is supplied later.

2. TRANSITION

Move the visual narrative from:
“Online learning forgot the learner.”

to:
“What if the platform noticed?”

The transition should begin moving the page from darkness toward light.

3. NOTICE JOURNEY

Heading:
“What if the platform noticed?”

Supporting:
“Gurukul doesn't send generic notifications. It responds to what the learner is actually doing.”

Journey:
ENROLLED
↓
WATCHING
↓
QUIZ FAILED
↓
TRYING AGAIN
↓
INACTIVE
↓
RETURNS
↓
COMPLETES

4. CONTEXTUAL ENCOUNTERS

At key moments, show a lightweight mentor encounter:
- Enrolled → Arjuna
- Failed quiz + retries → Karna
- Inactive → Babur
- Returns → Ekalavya

This document only needs a lightweight presentation. Document 04 will create the full reusable mentor system.

Do not build six full mentor cards here.

The mechanism should be clear:
Learner action
→ platform recognises action
→ appropriate mentor appears
→ contextual message

5. INTERACTION
Desktop:
Scroll through the journey and emphasise the current event.

Mobile:
Use a vertical stacked journey or simplified scroll sequence.

Do not trap scrolling.

6. VISUAL
- earthy Ajanta-inspired palette
- restrained gold/ochre highlights
- shirorekha-inspired section rule
- coherent dark-to-light transition

Do not use a generic SaaS timeline component.

7. ACCESSIBILITY
All events and messages must exist as readable text.
Animation is enhancement only.

8. PERFORMANCE
Use CSS/GSAP only where useful.
Do not load the full mentor animation library/assets here.
Do not create unnecessary continuous animation loops.

9. ACCEPTANCE
- Problem is understandable without animation.
- Learner journey is understandable.
- Platform-noticing concept is clear.
- Contextual intervention is demonstrated.
- Mobile works.
- Existing sections remain intact.

STOP.
