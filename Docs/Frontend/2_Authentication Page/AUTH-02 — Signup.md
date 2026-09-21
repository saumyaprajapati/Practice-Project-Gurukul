# GURUKUL — AUTHENTICATION IMPLEMENTATION DOCUMENT 02

## SIGNUP PAGE

### SCOPE

Implement only the Signup page and its navigation into the Email Code Entry flow.

Do not implement Login or Recovery behaviour in this session.

---

# 1. BEFORE EDITING

Inspect:

* repository instructions
* existing landing page
* `AUTH-00`
* `AUTH-01`
* existing authentication components

Preserve existing work.

Do not modify backend.

Do not convert JavaScript to TypeScript.

---

# 2. PAGE

Route:

`/auth/signup`

Use the shared authentication shell.

Title:

`Create your Gurukul account`

The exact visual copy may be refined only if required for consistency with the existing product voice.

---

# 3. FIELDS

Display:

### Name

Text input.

### Email

Email input.

Mandatory.

### Password

Password input.

### Confirm Password

Password input.

Mandatory when submitting.

---

# 4. SIGNUP BUTTON

Text:

`Sign Up`

Initial state:

disabled unless:

* email contains a usable value
* password contains a usable value

The button must become interactive once these minimum conditions are satisfied.

Before submission, validate:

* required fields
* password
* confirm password

---

# 5. PASSWORD MATCH

Password and Confirm Password must match exactly.

Comparison is case-sensitive.

If they do not match when submission is attempted:

Display below the button:

`password and confirm password doesn't match each other`

Use the shared authentication error style.

Do not silently change either password.

---

# 6. EMAIL PASSING

On successful Signup validation:

Pass the entered email to the Email Code Entry flow.

Do not pass the password through the URL.

Do not expose the password in navigation state unnecessarily.

The code-entry page must know which email is being verified.

---

# 7. EMAIL CODE FLOW

Successful flow:

Signup

↓

Email Code Entry

The Email Code Entry page will be implemented in a later document.

Create only the navigation/data contract required by this document.

---

# 8. EXISTING ACCOUNT

Display:

`Already Have An Account?`

with an action to:

`/auth/login`

Use the shared navigation styling.

---

# 9. HONEYPOT

Include the hidden honeypot field defined in `AUTH-00`.

It must:

* remain invisible to normal users
* not interfere with normal form completion
* be submitted with the form
* trigger the temporary bot-block behaviour when populated

Do not expose the honeypot label or purpose visually.

---

# 10. VALIDATION UX

Do not overwhelm the user with errors.

Normal flow:

user interacts

↓

user submits

↓

invalid state is explained clearly

Valid state:

↓

continue to code entry

---

# 11. ANIMATION

Use the shared authentication animation system.

Possible subtle effects:

* card entrance
* diya illumination
* input focus illumination
* button state transition

Do not add large new animation systems.

Respect reduced motion.

---

# 12. RESPONSIVE

Verify:

* mobile
* tablet
* desktop

No horizontal overflow.

Inputs and buttons must remain touch-friendly.

---

# 13. ACCEPTANCE

Signup must:

* render correctly
* use Gurukul authentication styling
* require email before enabling the primary action
* require password before enabling the primary action
* compare password and confirmation case-sensitively
* display the exact requested mismatch error
* pass email to code entry
* provide Login navigation
* contain the hidden honeypot
* support keyboard navigation
* support reduced motion

## STOP AFTER THIS DOCUMENT.
