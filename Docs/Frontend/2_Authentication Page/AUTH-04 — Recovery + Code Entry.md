# GURUKUL — AUTHENTICATION IMPLEMENTATION DOCUMENT 04

> **Superseded backend (Phase 5):** codes are now 6 digits, generated and emailed by Supabase Auth (`verifyOtp` with type `email` / `recovery`), with a "Resend code" action on the code screen. See `frontend/supabase/README-phase5.md`.

## EMAIL RECOVERY + EMAIL CODE ENTRY

### SCOPE

Implement:

1. Email Recovery / Email Verification page
2. Email Code Entry page

These screens form one continuous verification flow.

---

# 1. BEFORE EDITING

Inspect:

* repository instructions
* existing authentication shell
* Signup implementation
* Login implementation
* shared validation utilities
* centralized redirect target

Do not redesign existing authentication screens.

Do not modify backend.

Do not convert to TypeScript.

---

# 2. EMAIL RECOVERY PAGE

Preferred route:

`/auth/recovery`

Purpose:

Allow the user to enter the email address associated with the recovery request.

---

# 3. EMAIL FIELD

Display:

`Email`

Mandatory.

Use:

`type="email"`

The user cannot continue without an email value.

---

# 4. CONTINUE BUTTON

Text:

`Continue`

When clicked with a valid email:

1. Store/pass the email safely to the Code Entry page.
2. Generate or establish the temporary verification-code state.
3. Navigate to Code Entry.

Do not place a password in navigation state or URL.

Do not expose the generated code in the UI.

Do not claim that a real email was delivered.

The architecture must allow a real email service to replace this prototype behaviour later.

---

# 5. CODE ENTRY PAGE

Preferred route:

`/auth/code`

This screen receives the email from:

* Signup
  or
* Recovery

It must therefore be reusable for both flows.

Do not create separate duplicate code-entry pages.

---

# 6. EMAIL DISPLAY

Show the email being verified.

Prefer a privacy-conscious presentation if appropriate, for example partially masking the address.

The user must still understand which email the code belongs to.

---

# 7. CODE FIELD

Display a code input for:

`4 digits`

The field is mandatory.

Accept only the intended 4-digit format.

Prevent obviously invalid values such as alphabetic input where appropriate.

Do not expose the expected code in the UI.

---

# 8. CONTINUE BUTTON

Text:

`Continue`

On submission:

### Correct code

Navigate using the centralized post-auth destination.

### Incorrect code

Display exactly:

`Incorrect Code Enterred`

Use the shared authentication error system.

Remain on the code-entry page.

Do not redirect on incorrect code.

---

# 9. CODE GENERATION

For the current frontend-only implementation:

* generate a temporary 4-digit code
* associate it with the current verification flow/email
* compare user input against that code

Keep code generation and verification isolated from UI components.

Do not scatter code comparison logic through JSX.

The future backend should be able to replace the implementation without redesigning the screen.

---

# 10. FLOW SOURCE

The code-entry page should know whether it was reached from:

### Signup

or

### Recovery

Do not duplicate the entire code-entry component.

Use a small flow/context identifier where required.

The UI may remain mostly identical.

The post-verification behaviour can use the centralized redirect contract.

---

# 11. NAVIGATION SAFETY

Do not allow malformed direct navigation to break the page.

If `/auth/code` is opened without the required email/verification context:

show a graceful recovery state and provide a route back to:

`/auth/recovery`

or

`/auth/signup`

depending on what the existing flow architecture supports.

Do not throw an uncaught runtime error.

---

# 12. RESEND

Do not implement a complex resend system unless it already exists in the repository.

If a resend action is implemented, isolate it so that:

* it generates a new code
* invalidates the previous code
* provides clear user feedback
* does not expose the code

Avoid unnecessary countdown/state complexity in this phase.

---

# 13. VISUAL DESIGN

Continue the same Gurukul visual language:

* dark lamp-black background
* restrained illumination
* manuscript-inspired surfaces
* earthy palette
* Anek typography
* restrained gold
* subtle diya motif

Do not introduce a new visual system.

---

# 14. ANIMATION

Use subtle transitions only.

Examples:

* email verification state
* code-entry appearance
* success transition

No heavy animation.

Respect:

`prefers-reduced-motion`

---

# 15. ACCESSIBILITY

Ensure:

* code input has an accessible label
* errors are accessible
* focus behaviour is logical
* keyboard users can submit
* mobile keyboard does not break the layout
* content does not depend on animation

---

# 16. ACCEPTANCE

Email Recovery must:

* require email
* pass email into Code Entry
* navigate correctly

Code Entry must:

* receive email/context safely
* accept a 4-digit code
* reject incorrect codes
* show `Incorrect Code Enterred`
* continue on correct code
* use centralized post-auth redirection
* handle missing verification state gracefully
* work on mobile
* support reduced motion

## STOP AFTER THIS DOCUMENT.
