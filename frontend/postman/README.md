# Gurukul Postman collection

Gurukul has no API server of its own: the browser talks straight to
**Supabase**. This collection makes the same calls the app makes, so you can
explore and test the backend without the UI:

| Supabase API | Path | What's in the collection |
|---|---|---|
| Auth | `/auth/v1/…` | log in (per role), sign up, verify code, resend, recovery, refresh, current user, change password, log out |
| Database tables | `/rest/v1/<table>` | courses, curriculum, profile, enrollments, lesson progress, deletion requests, lesson media |
| Database functions (RPC) | `/rest/v1/rpc/<name>` | all 34 public functions in `supabase/*.sql`: checkout, create course, analytics, every admin action… |
| Storage | `/storage/v1/object/…` | upload, sign, download and delete lesson files |

## Files

| File | What it is |
|---|---|
| `Gurukul.postman_collection.json` | The collection: import this |
| `Gurukul.postman_environment.json` | The **Gurukul** environment, placeholders only: import this too |
| `build-collection.mjs` | Generates both files. Edit this, not the JSON |

## 1. Import

1. Install [Postman](https://www.postman.com/downloads/) (desktop or web).
2. **Import** → drag in both JSON files from this folder.
3. Top-right environment picker → choose **Gurukul**.

## 2. Fill in the environment

Open **Environments → Gurukul** and type into the **Current value** column.
Current values stay on your machine: they are never synced or committed.

| Variable | Value |
|---|---|
| `supabase_url` | same as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` |
| `publishable_key` | same as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `captcha_token` | leave as `XXXX.DUMMY.TOKEN.XXXX` (see CAPTCHA below) |
| `learner_email` / `learner_password` | a normal test account |
| `instructor_email` / `instructor_password` | an account that clicked **Become an instructor** |
| `admin_email` / `admin_password` | an admin (set with the SQL in `supabase/README-phase5.md` → "Making an admin") |
| `signup_email` / `signup_password` | only for the Sign up request: a new, unused address |
| `new_password` | only for the Change password request |

Everything else (`access_token`, `user_id`, `course_id`, `lesson_key`, …) is
filled in automatically by the requests' test scripts.

Never put the **secret** key (`SUPABASE_SECRET_KEY`) in Postman. It bypasses
all security rules. The publishable key is enough.

### CAPTCHA

Log in, sign up and password recovery are protected by Cloudflare Turnstile.

- **Test keys** (the local setup in `supabase/README-phase5.md`): the default
  `captcha_token` value `XXXX.DUMMY.TOKEN.XXXX` is always accepted. Nothing to do.
- **A real Turnstile key**: either temporarily switch Supabase to the test
  secret (Authentication → Attack Protection → Captcha), or copy a fresh token
  from the browser: DevTools → Network → log in → the `token` request →
  `gotrue_meta_security.captcha_token`. A real token works **once**, so you
  need a new one for every login.

## 3. Use it

1. Run **1. Auth → Log in as Instructor** (or Learner / Admin). The token is
   saved, and every other request now runs as that user.
2. To act as someone else, run a different **Log in as …** request.
3. Ids flow between requests. For example, **5. Instructor → Create course**
   saves `course_id`, and **3. Catalogue → Get curriculum** saves `module_id`
   and `lesson_key`, which the Learning, Media and Admin requests then use.

| Folder | Log in as | What it covers |
|---|---|---|
| 1. Auth | – | sessions and account |
| 2. Profile | anyone | own profile, become instructor |
| 3. Catalogue | anyone | courses and curriculum (locked lessons have no content) |
| 4. Learning | Learner | checkout, progress, the "watching now" heartbeat |
| 5. Instructor | Instructor | create/extend courses, deletion request, **Course analytics** |
| 6. Lesson media | Instructor | upload → register → sign → download → remove |
| 7. Admin | Admin | stats, courses, content, users, enrollments (reversible actions) |
| 8. ⚠ Admin danger zone | Admin | permanent deletes: run one at a time, on purpose |
| 9. Security checks | (logs in as Learner) | requests that **must be refused**; they pass when Supabase says no |
| 10. Flow | (logs in as needed) | the whole journey end to end |

## 4. Run the end-to-end flow

Right-click **10. Flow: course end to end** → **Run folder** → **Run**. It:

1. logs in as the instructor and creates a test course,
2. logs in as the admin and approves it,
3. logs in as the learner, enrols, completes a lesson and sends a heartbeat,
4. logs in as the instructor and checks the analytics count the learner,
5. logs in as the admin and deletes the test course again.

Every request should be green. It needs all three test accounts filled in.

**9. Security checks** needs a `course_id` the learner doesn't own. Create one
first (5. Instructor → Create course).

From the terminal instead (export your filled-in environment from Postman first):

```
npx newman run postman/Gurukul.postman_collection.json -e gurukul-env.json --folder "10. Flow: course end to end"
```

Keep that exported environment file out of Git: it contains your passwords.

## 5. Updating the collection

When you add or change a database function, table query or Auth call:

```
node postman/build-collection.mjs
```

Then re-import `Gurukul.postman_collection.json` in Postman (choose
**Replace**). The script fails if a public function in `supabase/*.sql` is
missing from the collection, so new RPCs can't be forgotten.

## Good to know

- Everything runs against your **real** Supabase project and data. Test
  courses created here show up in the app.
- Sign up and password recovery send real emails, and Supabase's built-in sender
  allows only about 2 per hour. With "Confirm email" off (see `SHARING.md`), Sign up
  signs in straight away and sends nothing.
- `access_token` expires after an hour. Run **Refresh token** or log in again.
- A free Supabase project pauses after about a week without activity. If every
  request times out, restore it from the Supabase dashboard.
