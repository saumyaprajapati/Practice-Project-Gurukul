# GURUKUL — AUTHENTICATION IMPLEMENTATION DOCUMENT 03

## LOGIN PAGE

### SCOPE

Implement only Login.

Do not implement Signup or Recovery behaviour beyond navigation links required by Login.

---

# 1. ROUTE

Preferred route:

`/auth/login`

Follow existing repository conventions if a different auth route structure has already been established.

---

# 2. FIELDS

### Email

Mandatory.

Use:

`type="email"`

### Password

Mandatory.

Use:

`type="password"`

---

# 3. CAPTCHA-LIKE CHALLENGE

Create a lightweight frontend CAPTCHA-style challenge.

Requirements:

1. Display an image containing a generated text value.
2. Provide an input below the image.
3. User enters the text visible in the image.
4. Comparison must determine whether the answer is correct.
5. The comparison should be case-sensitive unless the implementation clearly establishes a different rule.
6. A new challenge should be possible after an invalid attempt.

Do not use an external CAPTCHA provider for this prototype unless an existing project dependency already provides one.

The implementation should be isolated so a production CAPTCHA provider can replace it later.

Do not claim this frontend challenge is a security-grade CAPTCHA.

---

# 4. LOGIN BUTTON

Text:

`Login`

The button remains disabled until:

* email has a usable value
* password has a usable value

CAPTCHA validation occurs during submission.

If the required email/password fields are empty, Login must not submit.

If the CAPTCHA is incorrect, show an accessible error and do not continue.

---

# 5. SUCCESS

For the current phase, successful Login should use the centralized post-auth redirect target defined in `AUTH-00`.

Do not hard-code the destination directly inside the Login component.

Do not implement a dashboard in this session.

---

# 6. FORGOT PASSWORD

Display:

`Forgot Password`

This navigates to:

`/auth/recovery`

The recovery page will be implemented separately.

---

# 7. SIGNUP NAVIGATION

Provide a clear route to:

`/auth/signup`

Use the shared authentication navigation style.

---

# 8. HONEYPOT

Include the hidden honeypot field.

Normal users must never see it.

If populated:

* reject the login submission
* trigger the temporary bot-block behaviour defined in `AUTH-00`
* do not continue to the destination

Do not reveal the honeypot mechanism to the user.

---

# 9. ERROR HANDLING

Use the shared error system.

Possible states:

* missing email
* missing password
* invalid CAPTCHA
* honeypot triggered
* temporary blocked state

Do not reveal unnecessary implementation details.

---

# 10. ANIMATION

Reuse the authentication shell.

The CAPTCHA image may have a subtle visual treatment, but do not animate it continuously.

Respect reduced motion.

---

# 11. ACCESSIBILITY

Ensure:

* CAPTCHA has an accessible description
* CAPTCHA input has a label
* errors are readable by assistive technologies
* keyboard users can complete the entire login flow
* focus is not lost unexpectedly

---

# 12. ACCEPTANCE

Login must:

* render correctly
* require email
* require password
* disable the button until minimum required fields exist
* display the CAPTCHA challenge
* validate CAPTCHA input
* navigate to recovery
* navigate to signup
* include the hidden honeypot
* use centralized post-auth redirection
* work on mobile
* support reduced motion

## STOP AFTER THIS DOCUMENT.