# GURUKUL — AUTHENTICATION IMPLEMENTATION DOCUMENT 01

## SHARED AUTHENTICATION SHELL

### SCOPE

Implement only the reusable visual and structural authentication shell.

Do not implement the detailed Signup, Login, Recovery, or Code Entry behaviour yet.

---

# 1. BEFORE EDITING

Inspect:

* `frontend/CLAUDE.md`
* `frontend/AGENTS.md`
* `frontend/package.json`
* existing landing-page components
* existing global CSS
* authentication foundation from `AUTH-00`

Preserve existing landing-page implementation.

Do not modify backend.

Do not convert JavaScript to TypeScript.

---

# 2. DESIGN OBJECTIVE

Authentication should feel like the next room of Gurukul rather than a different website.

The landing page begins in darkness and moves toward light.

Authentication should continue this visual language.

Use:

* deep charcoal/lamp-black
* red ochre
* turmeric/gold
* manuscript cream
* earthy brown
* restrained lapis

Primary typography:

Anek.

Do NOT use Tiro Devanagari Sanskrit for authentication UI.

Tiro remains reserved for historical mentor dialogue.

---

# 3. AUTH PAGE COMPOSITION

Create a reusable authentication layout.

Conceptually:

dark atmospheric background

↓

subtle illumination

↓

GURUKUL identity

↓

authentication surface

↓

supporting navigation/action

The authentication surface should remain visually lightweight.

Do not create an oversized generic SaaS card.

---

# 4. BRANDING

Display:

GURUKUL

Use the same visual identity established by the landing page.

The authentication page may use a subtle diya/illumination motif.

Keep it restrained.

The diya should support the brand metaphor rather than become decorative clutter.

---

# 5. AUTH CARD

Create a reusable authentication container supporting:

* page title
* optional description
* form content
* primary action
* secondary navigation
* error area
* optional footer/helper text

The component must work for all authentication screens.

Do not hard-code Signup-specific content into the shared component.

---

# 6. INPUT SYSTEM

Create reusable styling for authentication inputs.

Inputs must have:

* visible label
* appropriate type
* placeholder only where genuinely useful
* focus state
* disabled state
* error state
* accessible association

Do not rely only on placeholders as labels.

Password inputs must use:

`type="password"`

Email inputs must use:

`type="email"`

---

# 7. BUTTON SYSTEM

Create a reusable primary authentication button style.

States:

* default
* hover
* focus
* active
* disabled

Disabled buttons must be visually distinguishable.

The style should match the Gurukul landing-page CTA language.

Do not create a visually unrelated button system.

---

# 8. ERROR SYSTEM

Create a reusable error presentation pattern.

Errors must:

* be readable
* be visually distinct
* not depend only on red colour
* be associated with the relevant form state
* work with screen readers

Do not show errors before the user has meaningfully interacted with the relevant field unless the flow requires it.

---

# 9. PAGE TRANSITIONS

Authentication pages may use subtle transitions when navigating between screens.

Use the lightest appropriate mechanism.

Prefer:

* CSS
* opacity
* transform

Do not introduce GSAP solely for authentication page transitions.

Respect reduced motion.

---

# 10. RESPONSIVE BEHAVIOUR

Desktop:

* authentication content can sit within a cinematic dark environment
* content should remain comfortably readable
* avoid excessive empty space

Mobile:

* authentication form takes priority
* no horizontal overflow
* controls remain touch-friendly
* content remains comfortably readable
* keyboard interaction must remain usable

---

# 11. ACCESSIBILITY

Implement:

* semantic forms
* labels
* keyboard navigation
* visible focus
* sufficient contrast
* reduced-motion support
* accessible error region
* accessible buttons

---

# 12. ACCEPTANCE

After this session:

* reusable AuthLayout exists
* reusable authentication input styling exists
* reusable button styling exists
* reusable error styling exists
* authentication pages can use the shared shell
* visual language matches the landing page
* no detailed authentication flow has been implemented

## STOP AFTER THIS DOCUMENT.