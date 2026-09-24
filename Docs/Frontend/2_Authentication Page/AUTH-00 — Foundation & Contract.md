# GURUKUL — AUTHENTICATION IMPLEMENTATION DOCUMENT 00

> **Superseded backend (Phase 5):** authentication now runs on Supabase Auth — 6-digit emailed codes, Cloudflare Turnstile instead of the image `Captcha`, Supabase session cookies instead of a custom JWT. The screens and flow below are unchanged; see `frontend/supabase/README-phase5.md` for the current setup.

## FOUNDATION + SHARED CONTRACT

### PURPOSE

Establish the shared architecture and implementation contract for the Gurukul authentication flow.

This document does NOT implement the individual authentication screens.

It defines the shared rules that all later authentication documents must follow.

---

# 1. REPOSITORY RULES

The existing project is:

`Practice - Gurukul - 01/`

Frontend:

`frontend/`

The frontend is an existing Next.js application using:

* Next.js
* App Router
* JavaScript (`.js`)
* Existing project configuration

Before making changes:

1. Inspect `frontend/CLAUDE.md`.
2. Inspect `frontend/AGENTS.md`.
3. Inspect `frontend/package.json`.
4. Inspect the existing `frontend/src/app/` structure.
5. Inspect the currently implemented landing page.
6. Inspect existing reusable components before creating new ones.

### MUST NOT

* Convert JavaScript to TypeScript.
* Recreate the Next.js application.
* Replace `package.json`.
* Replace existing configuration.
* Modify backend functionality for this frontend-only authentication phase.
* Touch `.next/`.
* Touch `node_modules/`.
* introduce a new authentication backend.
* introduce a real database authentication system.
* introduce real email sending.
* introduce production-grade CAPTCHA infrastructure.

Use existing dependencies whenever possible.

Do not install a dependency when the required behaviour can reasonably be implemented with existing browser/React/Next.js capabilities.

---

# 2. RELATIONSHIP WITH THE LANDING PAGE

Authentication is a separate product flow but must visually belong to the same Gurukul product.

The landing page already establishes:

* Anek typography
* Ajanta-inspired earthy palette
* lamp-black/deep charcoal
* red ochre
* turmeric/gold
* manuscript/palm-leaf cream
* earthy brown
* restrained lapis
* shirorekha-inspired horizontal rules
* diya/illumination metaphor
* dark-to-light visual progression
* restrained animation
* responsive behaviour
* reduced-motion support

Authentication must reuse these principles rather than inventing a new visual language.

Do NOT make the authentication pages look like a generic SaaS login template.

Avoid:

* purple gradients
* glassmorphism
* neon effects
* generic blue authentication screens
* excessive rounded cards
* stock photography
* unrelated illustrations
* excessive shadows
* excessive gold
* decorative clutter

---

# 3. AUTHENTICATION ROUTES

Create a clean route structure following the existing repository conventions.

Preferred conceptual routes:

`/auth/signup`

`/auth/login`

`/auth/recovery`

`/auth/code`

If the existing project already has an authentication route convention, follow it instead of blindly creating the above structure.

Do not create duplicate routing systems.

---

# 4. AUTHENTICATION FLOW

The intended flow is:

LANDING PAGE

`Enter the Gurukul`

↓

AUTHENTICATION

User can choose:

`Signup`
or
`Login`

---

## Signup

Signup

↓

Enter:

* Name
* Email
* Password
* Confirm Password

↓

Submit

↓

Email Code Entry

↓

Valid code

↓

Temporary post-auth destination

---

## Login

Login

↓

Email

Password

CAPTCHA

↓

Submit

↓

Temporary post-auth destination

---

## Forgot Password

Login

↓

Forgot Password

↓

Email Verification

↓

Email Code Entry

↓

Valid code

↓

Temporary post-auth destination

---

# 5. CURRENT POST-AUTH DESTINATION

The project currently does not need a real dashboard implementation.

Therefore:

### Centralize the post-auth redirect target.

Do not scatter `/` or `/dashboard` throughout components.

Create one clearly defined redirect configuration/helper.

For the current phase, use:

`/`

as the temporary successful-auth destination if a real dashboard route does not already exist.

The architecture must make it easy to later change this to:

`/dashboard`

without modifying every authentication component.

Do not implement a dashboard as part of this task.

---

# 6. SHARED AUTH STATE

This phase is a frontend authentication-flow prototype.

Do NOT implement:

* database authentication
* password hashing
* JWT authentication
* sessions
* real email delivery
* backend verification
* persistent user accounts

The UI should nevertheless behave like a realistic authentication flow.

Use local component state or a small shared utility where appropriate.

Avoid unnecessary global state.

---

# 7. SHARED VALIDATION PRINCIPLES

Validation must be explicit and predictable.

Required fields:

Signup:

* Email
* Password
* Confirm Password

Name is displayed and accepted but is not required unless existing project conventions say otherwise.

Login:

* Email
* Password
* CAPTCHA answer

Recovery:

* Email

Code entry:

* 4-digit code

Do not duplicate validation logic unnecessarily.

Where practical, create small reusable validation helpers.

Do not introduce a large validation framework merely for these forms.

---

# 8. EMAIL HANDLING

Email is the primary piece of data passed between authentication screens.

For example:

Signup:

`signup → code`

must pass the entered email.

Recovery:

`recovery → code`

must pass the entered email.

Do not expose passwords in URLs.

Do not place passwords into query parameters.

Prefer a safe client-side state mechanism appropriate to the existing application architecture.

The code-entry screen should display which email is being verified, preferably in a privacy-conscious form.

---

# 9. CODE VERIFICATION

For the current frontend prototype:

* Generate/use a temporary 4-digit verification code.
* The code must be validated before successful continuation.
* Incorrect code displays:

`Incorrect Code Enterred`

Preserve the exact requested wording for this phase.

Do not expose the generated code visibly in the UI.

Do not claim that a real email was sent.

Keep the code-generation/verification mechanism isolated so that a real backend/email service can replace it later.

---

# 10. HONEYPOT

Signup and Login both require a hidden honeypot field.

The field:

* must not be visible to normal users.
* must not be visually accessible as a normal form control.
* should use an appropriate bot-trap implementation.
* should not be marked as required.
* should be ignored when empty.

If the honeypot is populated:

Treat the submission as a bot submission.

For this frontend phase, implement the required temporary blocking behaviour without pretending it is a secure server-side security control.

The intended behaviour is:

honeypot triggered

↓

authentication submission rejected

↓

user should not be allowed to proceed for approximately 5 minutes

The implementation must be structured so that this rule can later be enforced server-side.

Do not claim that a client-side five-minute block provides real security.

---

# 11. ACCESSIBILITY

All authentication pages must support:

* semantic form elements
* associated labels
* keyboard navigation
* visible focus states
* accessible error messages
* accessible button states
* sufficient contrast
* logical heading hierarchy
* screen-reader-readable validation feedback
* reduced-motion behaviour

Do not communicate validation errors through colour alone.

---

# 12. RESPONSIVE DESIGN

Authentication must work on:

* small mobile phones
* large mobile phones
* tablets
* laptops
* large desktop screens

Mobile is not an afterthought.

Do not simply shrink the desktop authentication card.

Design the layout responsively from the beginning.

---

# 13. PERFORMANCE

Authentication screens should be lightweight.

Avoid:

* unnecessary client components
* large image assets
* video backgrounds
* heavy animation libraries
* unnecessary dependencies
* continuous animation loops

Animations should enhance the experience, never delay interaction.

---

# 14. REDUCED MOTION

When:

`prefers-reduced-motion: reduce`

is enabled:

* disable elaborate entrance animations
* reduce movement
* keep transitions short/subtle
* keep all content immediately understandable

No authentication functionality may depend on animation.

---

# 15. CODE ORGANISATION

Follow the existing project structure.

A possible structure is:

`frontend/src/app/auth/...`

and reusable components such as:

`frontend/src/components/auth/...`

Possible reusable components:

* `AuthLayout`
* `AuthCard`
* `AuthHeader`
* `AuthInput`
* `AuthButton`
* `AuthError`
* `AuthDivider`
* `Captcha`
* `HoneypotField`

These are suggestions, not mandatory filenames.

Do not create components merely to make the folder structure look sophisticated.

Create abstractions only where they remove real duplication.

---

# 16. IMPORTANT IMPLEMENTATION PRINCIPLE

Authentication screens must feel like one system.

Do not independently design each page.

Shared elements such as:

* spacing
* typography
* buttons
* inputs
* borders
* focus states
* errors
* animation
* background treatment
* navigation between auth pages

should be consistent.

---

# 17. ACCEPTANCE

After this document is implemented:

* shared authentication architecture exists
* routes are established
* shared auth styling primitives exist where appropriate
* redirect destination is centralized
* validation architecture is clear
* email/code flow contract is clear
* honeypot contract is clear
* no individual authentication screen has been unnecessarily over-implemented

## STOP AFTER THIS DOCUMENT.
