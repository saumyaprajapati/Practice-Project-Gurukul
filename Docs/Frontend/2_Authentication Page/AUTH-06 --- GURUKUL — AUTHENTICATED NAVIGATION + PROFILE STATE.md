# GURUKUL — AUTHENTICATED NAVIGATION

## PROFILE STATE + HEADER BEHAVIOUR

### PURPOSE

Fix the navigation behaviour after authentication.

Currently, after Signup/Login, the landing-page header can still display:

`Enter the Gurukul`

and that action can lead users back to Signup/Login.

The header must instead reflect whether the user is authenticated.

This is a focused integration task. Do not redesign the landing page or authentication screens.

---

# 1. BEFORE EDITING

Inspect:

* `frontend/CLAUDE.md`
* `frontend/AGENTS.md`
* `frontend/package.json`
* existing navbar/header implementation
* existing authentication routes/components
* current post-auth redirect/state implementation
* existing landing-page components

Use the existing JavaScript/Next.js architecture.

Do not convert to TypeScript.

Do not modify unrelated landing-page sections.

Do not modify backend unless an existing authentication integration genuinely requires it.

---

# 2. REQUIRED HEADER STATES

The header must have two distinct states.

## STATE A — NOT AUTHENTICATED

Display the existing:

`Enter the Gurukul`

button.

Behaviour:

`Enter the Gurukul`

→ authentication entry point

→ user can choose Signup/Login.

Preserve the existing unauthenticated behaviour.

---

## STATE B — AUTHENTICATED

Once the user has successfully authenticated through Signup or Login:

Replace the unauthenticated header action with:

1. Profile icon
2. `Enter into Gurukul`

The authenticated state must NOT display:

`Enter the Gurukul`

as an authentication-entry action.

---

# 3. PROFILE ICON

Display a profile/avatar icon in the authenticated header.

Use an existing icon system if the project already has one.

Do not add a large icon library solely for this feature if a suitable existing implementation is available.

The icon should:

* be visually consistent with the Gurukul design system
* have an accessible label
* have a visible keyboard focus state
* remain usable on mobile
* not dominate the header

The profile icon is intended to become the user's account/profile entry point.

For this phase, implement only the navigation/state required by the existing project. Do not invent a complete profile/settings system.

---

# 4. ENTER INTO GURUKUL

Authenticated users should see:

`Enter into Gurukul`

This action must navigate to the authenticated application destination.

Use the existing centralized post-auth destination if one already exists.

Do NOT duplicate or hard-code a new destination inside the navbar.

If the project currently uses `/` as the temporary post-auth destination, preserve that contract unless a real authenticated destination already exists.

If a dashboard/application route already exists, use the existing route.

Do not create a new dashboard as part of this task.

---

# 5. AUTHENTICATION STATE

The header must determine whether the current user is authenticated using the authentication mechanism already implemented in the project.

Do NOT create a second independent authentication-state system if one already exists.

The implementation should have one clear source of truth for:

`authenticated`
vs
`not authenticated`

Avoid:

* duplicated auth state
* manually setting navbar state independently from login/signup
* hard-coded assumptions based only on the current URL
* authentication state that disappears immediately during normal navigation

---

# 6. AUTH SUCCESS INTEGRATION

After successful:

### Login

The application must update the shared authentication state before/while navigating to the authenticated destination.

### Signup + Code Verification

The application must update the shared authentication state after successful verification before/while navigating to the authenticated destination.

### Recovery + Code Verification

Follow the existing authentication contract.

Do not treat merely visiting an authentication page as authenticated.

Authentication state must only become authenticated after the existing successful-auth condition.

---

# 7. AUTH PAGE ACCESS AFTER LOGIN

Once authenticated:

Navigating directly to:

`/auth/login`

or

`/auth/signup`

must NOT result in the user being presented with an unnecessary login/signup flow if the existing architecture supports authenticated-route handling.

Use the smallest compatible behaviour.

At minimum, the landing-page header must never send an authenticated user back into Signup/Login through its primary authenticated CTA.

Do not create a large route-guard system unless the existing application requires it.

---

# 8. LOGOUT

Do not introduce a new logout system unless one already exists.

If an existing logout mechanism exists, ensure that after logout:

authenticated state is cleared

↓

header returns to:

`Enter the Gurukul`

If no logout mechanism exists yet, do not build a complete account menu solely for this task.

Keep the architecture ready for logout later.

---

# 9. REFRESH / NAVIGATION PERSISTENCE

Verify behaviour when:

1. User logs in.
2. User reaches authenticated destination.
3. User navigates back to the landing page.
4. User refreshes the page.
5. User navigates between landing-page sections.

The header must not incorrectly revert to the unauthenticated state if the project's existing authentication mechanism indicates that the user is still authenticated.

Do not introduce insecure client-only persistence merely to fake authentication.

---

# 10. RESPONSIVE BEHAVIOUR

Desktop authenticated header:

`GURUKUL ... [Profile Icon] [Enter into Gurukul]`

Mobile:

Maintain the existing mobile navigation behaviour.

The authenticated controls must:

* fit within the mobile header
* remain touch-friendly
* remain keyboard accessible
* not cause horizontal overflow
* not break the existing mobile menu

Do not redesign the mobile navigation.

---

# 11. VISUAL CONSISTENCY

The authenticated header must use the existing Gurukul design system:

* Anek typography
* existing palette
* existing button styling
* existing focus states
* restrained gold/illumination accents
* existing spacing/radius conventions

Do not introduce a generic SaaS avatar/header pattern.

The authenticated state should feel like a natural evolution of the existing landing-page header.

---

# 12. ACCESSIBILITY

Verify:

* profile icon has an accessible name
* `Enter into Gurukul` is accessible as a button/link
* keyboard navigation works
* visible focus exists
* mobile navigation remains accessible
* icon is not the only way to understand the available action

---

# 13. PERFORMANCE

Keep the change lightweight.

Do not add:

* unnecessary dependencies
* large avatar assets
* unnecessary client components
* continuous animation
* duplicate authentication listeners/state systems

Reuse existing authentication infrastructure.

---

# 14. ACCEPTANCE CRITERIA

### Unauthenticated

Header displays:

`Enter the Gurukul`

Clicking it can lead to authentication.

---

### Authenticated

Header displays:

`Profile Icon`

and

`Enter into Gurukul`

`Enter into Gurukul` navigates to the authenticated application destination.

It must NOT navigate to Signup/Login.

---

### Login

Successful Login:

authentication state becomes authenticated

↓

authenticated destination

↓

landing-page header shows authenticated state when visited.

---

### Signup

Successful Signup + Code Verification:

authentication state becomes authenticated

↓

authenticated destination

↓

landing-page header shows authenticated state when visited.

---

### Refresh

Authenticated state remains correct according to the existing authentication mechanism.

---

### Logout

If an existing logout mechanism exists:

logout

↓

authentication state cleared

↓

header returns to:

`Enter the Gurukul`

---

### No Regression

Verify that:

* existing landing-page sections remain unchanged
* existing authentication screens remain visually unchanged
* mobile navigation still works
* no dead links are introduced
* no duplicate auth-state systems are created
* no TypeScript conversion occurs
* no unrelated backend changes occur

## STOP AFTER THIS DOCUMENT.
