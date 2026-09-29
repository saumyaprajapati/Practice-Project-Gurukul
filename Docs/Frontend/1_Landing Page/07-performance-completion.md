GURUKUL — LANDING PAGE IMPLEMENTATION DOCUMENT 07
PERFORMANCE + COMPLETION

SCOPE
Implement only:
A. Performance philosophy
B. Completion/certificate sequence
C. Final CTA

REPOSITORY
Work inside frontend/.
Use JavaScript (.js).
Inspect existing instructions before editing.
Do not modify backend/.
Do not redesign previous sections.

PART A — PERFORMANCE

Heading:
“Built for a ₹15,000 phone, not a designer's MacBook.”

Communicate:
- Fast on 4G
- Adaptive video
- Adaptive animation
- Reliable progress

Show a stylised Android/mobile context.

Do not invent performance benchmarks.

ANIMATION TIERS

FULL:
- richer character animation
- environmental effects

LITE:
- reduced character/environment animation
- simpler transitions

MINIMAL:
- static artwork
- lightweight CSS transitions

The content remains available in every tier.

Respect:
prefers-reduced-motion

When reduced motion is enabled, prefer the minimal visual treatment.

Do not assume browser hardware metrics perfectly represent device performance. Use conservative signals and graceful fallback.

PART B — COMPLETION

Heading:
“You didn't buy another course.
You finished one.”

The environment should now be much brighter than the hero.

CERTIFICATE SEQUENCE
1. Scroll closed
2. Scroll unfurls
3. Certificate appears
4. Seal presses into place
5. Completion state

Use a restrained lapis-inspired seal.

The certificate is a product visual, not an official accreditation claim.

PART C — FINAL CTA

Heading:
“Begin your first course.”

Supporting:
“The path starts with one lesson.”

CTA:
“Enter the Gurukul”

Use the existing auth/app route if one exists.
Do not invent authentication.

VISUAL ARC
The page began in darkness and should now be fully illuminated.

ACCESSIBILITY
- certificate content exists as text
- animation not required
- reduced-motion version
- keyboard-accessible CTA

PERFORMANCE
- completion assets must not block initial load
- load heavy animation near the section
- avoid continuous CPU-heavy loops

ACCEPTANCE
- performance philosophy is clear
- animation tiers exist or are cleanly represented
- completion has emotional payoff
- certificate gracefully falls back
- final CTA works
- mobile works
- reduced motion works

STOP.
