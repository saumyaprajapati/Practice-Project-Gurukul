# Sharing Gurukul with a public link (no deployment)

Gurukul's backend (auth, database, file storage) already lives on Supabase.
Only the Next.js frontend runs on this PC. A **Cloudflare Quick Tunnel**
gives that local app a public `https://<random>.trycloudflare.com` URL that
anyone can open, from any network, while your PC is running it. You don't
need a Cloudflare account, a domain, or any payment.

## One-time setup

1. Install `cloudflared`:
   ```
   winget install --id Cloudflare.cloudflared
   ```
   Close and reopen the terminal, then check that it works: `cloudflared --version`.
2. Turn off email confirmation in Supabase. Every sign-up otherwise sends a
   code email, and Supabase's built-in email sender allows only a couple per hour:
   - Supabase Dashboard → **Authentication → Sign In / Providers → Email**
   - Switch **Confirm email** to **off** and save.

   New accounts are then signed in right after sign-up, with no code screen.

## Every time you share

Run these from the `frontend` folder, in two terminals:

```
npm run share     # terminal 1: builds, then serves http://localhost:3000
npm run tunnel    # terminal 2: start it after terminal 1 says "Ready"
```

Terminal 2 prints a line like `https://calm-river-1234.trycloudflare.com`.
That is the link to share.

To stop sharing, press **Ctrl+C** in both terminals. The link stops working immediately.

If you change code, stop `npm run share` and run it again. It serves a
production build, which doesn't update when files change.

## What to tell the people using it

- **Learner:** click Sign up, create an account, browse the courses and enrol.
- **Instructor:** after signing up, go to Profile → **Become an instructor**,
  then Create a Course and add lessons, videos and files. A new course stays
  *pending* until the admin (you) approves it in Admin → Courses.

## Good to know

- The link works only while your PC is awake and **both** terminals are running.
- The URL is **different every time** you run `npm run tunnel`, so send the new one each session.
- Quick Tunnels are meant for testing: there is no uptime guarantee, and they
  handle roughly 200 requests at the same time at most. That is plenty for
  friends or classmates.
- Everyone uses your real Supabase project and data. Uploads count toward the
  free plan's 1 GB of storage. **Never share the admin account.**
- A free Supabase project pauses after about a week without activity. If the
  app can't load data, restore the project from the Supabase dashboard.
- Password reset still sends an email, so it is still rate-limited.
- When you're done, you can switch **Confirm email** back on. Accounts created
  while it was off keep working.
