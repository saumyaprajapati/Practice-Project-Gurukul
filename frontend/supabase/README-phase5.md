# Phase 5 — Supabase as a full BaaS (Auth + Data API + RLS)

The app no longer has custom API routes: the browser talks to Supabase directly
with the **publishable** key, Supabase Auth owns accounts, and RLS policies plus
RPC functions (`phase5b-baas.sql`) decide what each user may read or write.

## Run order

| # | What | Where |
|---|---|---|
| 0 | Confirm a recent backup exists (Database → Backups) and check the FK names: `select conrelid::regclass, conname from pg_constraint where confrelid = 'public.users'::regclass;` — adjust `phase5c-cutover.sql` if they differ from `<table>_<column>_fkey` | Dashboard / SQL editor |
| 1 | `phase5a-lockdown.sql` | SQL editor (safe while the old app runs) |
| 2 | `phase5b-baas.sql` | SQL editor (additive) |
| 3 | `node --env-file=.env.local scripts/migrate-users-to-supabase-auth.mjs` | `frontend/` |
| 4 | Dashboard settings below | Supabase + Cloudflare dashboards |
| 5 | Re-run step 3 (catches accounts created meanwhile), then `phase5c-cutover.sql` | `frontend/` + SQL editor |
| 6 | Deploy / `npm run dev` the new frontend | |
| 7 | A week later: `drop table public.legacy_otp_codes, public.legacy_login_attempts, public.legacy_users;` | SQL editor |

Every user signs in once more after cutover (old `gurukul_session` cookies are dead).

## Dashboard settings (step 4)

| Where | Setting |
|---|---|
| Authentication → Sign In / Providers → Email | Enabled. **Confirm email: on.** Minimum password length **8** |
| Authentication → Email Templates → Confirm signup | Body: `<p>Your Gurukul code: <strong>{{ .Token }}</strong></p>` |
| Authentication → Email Templates → Reset password | Same, with `{{ .Token }}` |
| Authentication → Email OTP length / expiry | Length **6**, expiry **600 s** |
| Authentication → Attack Protection → Captcha | Enable **Cloudflare Turnstile**, paste the Turnstile **secret key** |
| Authentication → URL Configuration | Site URL `http://localhost:3000` (+ add to Redirect URLs) |
| Cloudflare → Turnstile | Create a widget for `localhost` (+ real domain later) → site key + secret key |
| Project Settings → Data API | Exposed schemas: **`public` only** — never `private` |
| Project Settings → API Keys | Copy the **publishable** key (`sb_publishable_...`) into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Before real users | Authentication → SMTP Settings: custom SMTP. The built-in sender only reaches project team addresses (~2 emails/hour) |

Local testing: Turnstile always-pass keys — site key `1x00000000000000000000AA`,
secret `1x0000000000000000000000000000000AA`.

## Custom SMTP (fixes "email rate limit exceeded")

The built-in sender allows only ~2 auth emails per hour and only to project
team addresses, so signup/recovery codes run out almost immediately. Any SMTP
provider works (Resend, Brevo, SendGrid, Postmark, AWS SES…):

1. Create an account with the provider and verify a sending domain (or use its
   sandbox/test domain while developing).
2. Supabase → Authentication → Emails → **SMTP Settings** → enable custom SMTP
   and fill in host, port (587), username, password, sender email and sender
   name (e.g. `Gurukul <no-reply@yourdomain>`).
3. Supabase → Authentication → **Rate Limits**: custom SMTP starts at 30
   emails/hour — raise it if needed.
4. Re-test signup, "Resend code" and password recovery.

The `{{ .Token }}` email templates above keep working unchanged.

## Phase 6 — Admin area (`phase6-admin.sql`)

Run `phase6-admin.sql` in the SQL editor after the cutover (safe to re-run).
It adds the admin-only RPCs behind `/gurukul/admin`:

| Area | What an admin can do |
|---|---|
| Dashboard | Counts of users, courses by status, pending reviews, enrollments |
| Courses | See every course at any status; edit all details, change status, transfer owner (new owner becomes instructor + gets access); delete instantly |
| Content | Rename / reorder / delete modules; edit / reorder / delete lessons; toggle free preview; add modules and lessons to any course |
| Users | Rename, make/remove instructor or admin, ban/unban (blocks sign-in, keeps data), delete permanently |
| Enrollments | Grant free access, renew, set expiry, revoke, reset progress, delete |

Guard rails (enforced in the database, mirrored in the UI): an admin can't
remove their own admin role or ban/delete themself, and another admin must be
demoted before being banned or deleted — so there is always at least one admin.
Deleting or adding lessons recalculates everyone's progress %, and progress
for deleted lessons is removed.

## Phase 7 — Lesson videos and files (`phase7-lesson-media.sql`)

Run `phase7-lesson-media.sql` after `phase6-admin.sql` (safe to re-run). It
creates the private **`lesson-media`** Storage bucket (50 MB per file; MP4/WebM
videos, PDFs, images, text, zip, Word/PowerPoint/Excel), the
`course_lesson_media` table, the storage access policies and the media RPCs.

- Each lesson can have **one video** (an upload, or a YouTube/Vimeo link) and any
  number of **files**. No video = no player on the lesson.
- Who sees media: the same rule as lesson text — enrolled learners, the course
  owner and admins, plus everyone signed in for free-preview lessons. Files are
  served through signed URLs that expire after an hour.
- Who manages media: the course owner (add-content page → "Videos & files") and
  admins (Admin → Courses → Edit → Media).
- **Storage → Settings → Global file size limit** must be at least 50 MB (the
  free-plan maximum). Free projects get 1 GB of storage and limited monthly
  egress — every video view counts, so prefer YouTube/Vimeo links for long or
  popular videos (set those to *Unlisted*; links can't be locked like uploads).
- Going Pro later: raise the global limit and the bucket's `file_size_limit`,
  update `MAX_UPLOAD_BYTES` in `src/lib/courses/media.js`, and use resumable
  (TUS) uploads for files over ~6 MB.

Orphaned files (uploaded but never registered, e.g. a tab closed mid-upload) —
list them, then delete them from Storage → lesson-media:

```sql
select o.name, o.created_at
from storage.objects o
where o.bucket_id = 'lesson-media'
  and not exists (select 1 from public.course_lesson_media m where m.storage_path = o.name);
```

## Phase 8 — Course analytics (`phase8-course-analytics.sql`)

Run `phase8-course-analytics.sql` after `phase7-lesson-media.sql` (safe to
re-run). It powers **My Courses → Course Analytics** for instructors:

- `lesson_activity`: one row per learner per course, holding the lesson they
  last had open and when. The lesson page sends a heartbeat every minute while
  it's visible (`touch_lesson_activity`). No direct table access.
- `course_analytics(course_id)`: totals, enrollments per month (last 12, UTC),
  progress spread, per-lesson drop-off, where unfinished learners stop, and
  per-module completion.
- `course_students(course_id)`: the learner list, with name, enrolment date,
  access, progress, current lesson and last active. Emails are left out on purpose.
- Only the course owner and admins can call the two read RPCs. The owner's own
  enrollment (added by `create_course`) is excluded from every number.
- "Watching now" and "last active" only have data from the moment this phase
  is live. Enrollment, completion and drop-off numbers use existing data.

## Phase 9 — MCP server search (`phase9-mcp.sql`)

Run `phase9-mcp.sql` after `phase8-course-analytics.sql` (safe to re-run). It
adds the two searches behind the AI-agent MCP server (the Python server in
`mcp-server/`, see `mcp-server/README.md`):

- `search_courses(query, limit)`: full-text + substring search over approved
  courses and their module/lesson titles, best match first, with `is_enrolled`
  for the caller.
- `search_my_lessons(query, course_id, limit)`: lesson text from courses the
  caller can open right now (active enrollment or own course). Expired courses
  and courses they aren't in return nothing.
- Both are **security invoker**: they run as the signed-in user, so the
  existing RLS decides what they see. GIN indexes keep lesson search fast.
- The OAuth server that lets agents sign in is a Dashboard setting, not SQL:
  see `mcp-server/README.md` → "Supabase setup".

## Making an admin

```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
```

## Quick RLS check (SQL editor)

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<learner-uuid>","role":"authenticated"}', true);
select count(*) from public.legacy_users;                                  -- permission denied
update public.enrollments set expires_at = now() + interval '10 years';    -- permission denied
update public.profiles set is_admin = true;                                -- permission denied (column)
select public.admin_set_course_status('python-foundations', 'declined');   -- "Admins only."
select count(*) from public.course_lesson_content;                         -- only previews + enrolled courses
select public.course_analytics('python-foundations');                      -- "You can only view analytics for your own courses."
select count(*) from public.lesson_activity;                               -- permission denied
select count(*) from public.search_my_lessons('welcome');                  -- only courses this learner can open
rollback;
```
