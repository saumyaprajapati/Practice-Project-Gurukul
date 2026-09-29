// Builds the Gurukul Postman collection + environment (Postman Collection
// v2.1) from the request list below. The app has no API routes of its own:
// every request goes straight to Supabase (Auth, PostgREST tables + RPCs,
// Storage), exactly as src/lib/** does.
//
//   node postman/build-collection.mjs
//
// It also checks that every public RPC defined in supabase/*.sql appears in
// the collection, and exits with code 1 if one is missing.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sqlDir = join(here, "..", "supabase");

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

const CAPTCHA = { captcha_token: "{{captcha_token}}" };
const COURSE_FIELDS = "id,title,description,category,instructor,thumbnail,price";
const ADMIN_COURSE_FIELDS = `${COURSE_FIELDS},status,owner_id,created_at,owner:profiles!courses_owner_id_fkey(name),enrollments(count)`;
const CURRICULUM_FIELDS =
  "id,title,position,course_lessons(id,lesson_key,title,duration_minutes,position,is_preview,course_lesson_content(content),course_lesson_media(id,kind,storage_path,external_url,file_name,mime_type,size_bytes,position))";

const rpcNames = new Set();

// Supabase Auth (GoTrue). Public endpoints send no Authorization header.
function authCall(name, method, path, body, opts = {}) {
  return { name, method, url: `{{supabase_url}}/auth/v1${path}`, body, noAuth: !opts.signedIn, ...opts };
}

// PostgREST table access, e.g. rest("…", "GET", "courses?select=id").
function rest(name, method, path, body, opts = {}) {
  return { name, method, url: `{{supabase_url}}/rest/v1/${path}`, body, ...opts };
}

// PostgREST RPC: POST /rest/v1/rpc/<fn> with the named p_* parameters.
function rpc(name, fn, params = {}, opts = {}) {
  rpcNames.add(fn);
  return { name, method: "POST", url: `{{supabase_url}}/rest/v1/rpc/${fn}`, body: params, ...opts };
}

function login(role) {
  const label = role[0].toUpperCase() + role.slice(1);
  return authCall(
    `Log in as ${label}`,
    "POST",
    "/token?grant_type=password",
    { email: `{{${role}_email}}`, password: `{{${role}_password}}`, gotrue_meta_security: CAPTCHA },
    {
      description: `Signs in the ${role} test account and stores its access token, so every following request runs as the ${role}.`,
      saves: {
        access_token: "json.access_token",
        refresh_token: "json.refresh_token",
        user_id: "json.user.id",
        [`${role}_user_id`]: "json.user.id",
        ...(role === "learner" ? { target_user_id: "json.user.id" } : {}),
      },
    }
  );
}

const SAMPLE_LESSON = {
  title: "Welcome",
  content: "Created from Postman.\n\nThis is the second paragraph.",
  durationMinutes: 5,
  isPreview: true,
};

// ---------------------------------------------------------------------------
// Requests, by folder
// ---------------------------------------------------------------------------

const createCourse = rpc(
  "Create course",
  "create_course",
  {
    p_title: "Postman Test Course {{$timestamp}}",
    p_description: "A course created from the Postman collection.",
    p_category: "Testing",
    p_price: 499,
    p_modules: [
      {
        title: "Getting started",
        lessons: [SAMPLE_LESSON, { ...SAMPLE_LESSON, title: "Your first query", isPreview: false, durationMinutes: 10 }],
      },
    ],
  },
  {
    description: "Instructors only. Creates a pending course (the owner is enrolled automatically) and saves its id as course_id.",
    saves: { course_id: "json" },
  }
);

const getCurriculum = rest(
  "Get curriculum",
  "GET",
  `course_modules?course_id=eq.{{course_id}}&order=position&select=${CURRICULUM_FIELDS}`,
  undefined,
  {
    description:
      "Modules with their lessons, lesson text and media (the same select as lib/courses/courses.js). Locked lessons come back without content. Saves the first module id and first lesson key.",
    saves: {
      module_id: "json[0] && json[0].id",
      lesson_key:
        "json[0] && json[0].course_lessons && [...json[0].course_lessons].sort((a, b) => a.position - b.position)[0]?.lesson_key",
    },
  }
);

const checkout = rpc("Checkout (enrol)", "checkout", { p_course_id: "{{course_id}}" }, {
  description: "Mock purchase / renewal of an approved course. Returns the enrollment row.",
});

const markComplete = rest(
  "Mark lesson complete",
  "POST",
  "lesson_progress",
  { course_id: "{{course_id}}", lesson_id: "{{lesson_key}}" },
  {
    description:
      "Inserts a progress row (RLS: own row, real lesson, active enrollment). A trigger recalculates enrollments.progress_percent. 409 = already completed, which is fine.",
    okStatuses: [201, 409],
  }
);

const heartbeat = rpc("Watching-now heartbeat", "touch_lesson_activity", {
  p_course_id: "{{course_id}}",
  p_lesson_key: "{{lesson_key}}",
}, { description: "What the lesson page sends every minute while it's visible. Feeds 'Watching now' in Course Analytics." });

const analytics = rpc("Course analytics", "course_analytics", { p_course_id: "{{course_id}}" }, {
  description: "Owner or admin only. Totals, enrollments per month, progress buckets, lesson funnel, stop points, module completion.",
});

const students = rpc("Course students", "course_students", { p_course_id: "{{course_id}}" }, {
  description: "Owner or admin only. Learner list (name only, no email) with progress, current lesson and last active.",
});

const approveCourse = rpc("Approve course", "admin_set_course_status", {
  p_course_id: "{{course_id}}",
  p_status: "approved",
});

const deleteCourse = rpc("⚠ Delete course", "admin_delete_course", { p_course_id: "{{course_id}}" }, {
  description: "Permanent. Cascades modules, lessons, media rows, enrollments and progress. Files in Storage are NOT removed; use 'Get media paths' first.",
});

const folders = [
  {
    name: "1. Auth",
    description: "Supabase Auth. Log in as a role first; every other folder uses the saved access_token.",
    items: [
      login("learner"),
      login("instructor"),
      login("admin"),
      authCall(
        "Sign up",
        "POST",
        "/signup",
        { email: "{{signup_email}}", password: "{{signup_password}}", data: { name: "Postman Tester" }, gotrue_meta_security: CAPTCHA },
        {
          description:
            "With 'Confirm email' OFF this returns a session straight away (and saves it). With it ON, a 6-digit code is emailed: use 'Verify code'.",
          saves: { access_token: "json.access_token", refresh_token: "json.refresh_token", user_id: "json.user && json.user.id" },
        }
      ),
      authCall("Verify code", "POST", "/verify", { type: "email", email: "{{signup_email}}", token: "{{otp_code}}" }, {
        description: "Confirms a sign-up code (type 'email') or a password-recovery code (type 'recovery') and signs in.",
        saves: { access_token: "json.access_token", refresh_token: "json.refresh_token", user_id: "json.user && json.user.id" },
      }),
      authCall("Resend sign-up code", "POST", "/resend", {
        type: "signup",
        email: "{{signup_email}}",
        gotrue_meta_security: CAPTCHA,
      }),
      authCall("Send password-recovery code", "POST", "/recover", { email: "{{signup_email}}", gotrue_meta_security: CAPTCHA }, {
        description: "Emails a recovery code. Rate-limited by Supabase's built-in email sender (about 2 per hour).",
      }),
      authCall("Refresh token", "POST", "/token?grant_type=refresh_token", { refresh_token: "{{refresh_token}}" }, {
        saves: { access_token: "json.access_token", refresh_token: "json.refresh_token" },
      }),
      authCall("Get current user", "GET", "/user", undefined, { signedIn: true }),
      authCall("⚠ Change password", "PUT", "/user", { password: "{{new_password}}" }, {
        signedIn: true,
        description: "Changes the signed-in account's password to new_password. The app re-checks the current password first by logging in again.",
      }),
      authCall("Log out", "POST", "/logout", undefined, { signedIn: true, okStatuses: [204] }),
    ],
  },
  {
    name: "2. Profile",
    items: [
      rest("Get my profile", "GET", "profiles?id=eq.{{user_id}}&select=name,is_instructor,is_admin"),
      rest("Rename me", "PATCH", "profiles?id=eq.{{user_id}}", { name: "Renamed from Postman" }, {
        prefer: "return=representation",
        description: "Only the name column is writable; is_instructor / is_admin updates are refused.",
      }),
      rpc("Become instructor", "become_instructor"),
    ],
  },
  {
    name: "3. Catalogue",
    items: [
      rest("List approved courses", "GET", `courses?status=eq.approved&select=${COURSE_FIELDS}&order=title`),
      rest("Get one course", "GET", `courses?id=eq.{{course_id}}&select=${COURSE_FIELDS}`),
      getCurriculum,
    ],
  },
  {
    name: "4. Learning (as Learner)",
    items: [
      checkout,
      rest("My enrollments", "GET", "enrollments?select=*"),
      rest("My enrollment for this course", "GET", "enrollments?course_id=eq.{{course_id}}&select=*"),
      rest("My completed lessons", "GET", "lesson_progress?course_id=eq.{{course_id}}&select=lesson_id"),
      markComplete,
      heartbeat,
    ],
  },
  {
    name: "5. Instructor",
    items: [
      createCourse,
      rest("My courses", "GET", "courses?owner_id=eq.{{user_id}}&select=id,title,description,category,price,status&order=title"),
      rpc(
        "Add module",
        "add_module",
        { p_course_id: "{{course_id}}", p_title: "Module added from Postman", p_lessons: [SAMPLE_LESSON] },
        { saves: { module_id: "json" } }
      ),
      rpc("Add lesson", "add_lesson", {
        p_course_id: "{{course_id}}",
        p_module_id: "{{module_id}}",
        p_title: "Lesson added from Postman",
        p_content: "Lesson text.",
        p_duration_minutes: 10,
        p_is_preview: false,
      }),
      rest("Request deletion", "POST", "course_deletion_requests", { course_id: "{{course_id}}" }, {
        prefer: "return=representation",
        description: "The owner can only request deletion; an admin approves or declines it. 409 = already requested.",
        okStatuses: [201, 409],
        saves: { request_id: "json[0] && json[0].id" },
      }),
      rest("My pending deletion requests", "GET", "course_deletion_requests?requested_by=eq.{{user_id}}&status=eq.pending&select=id,course_id"),
      analytics,
      students,
    ],
  },
  {
    name: "6. Lesson media (as Instructor)",
    description:
      "Private bucket lesson-media, path {course_id}/{lesson_key}/{uuid}-{file-name}. Run 'Get curriculum' first so course_id and lesson_key are set.",
    items: [
      {
        name: "Upload a text file",
        method: "POST",
        url: "{{supabase_url}}/storage/v1/object/lesson-media/{{media_path}}",
        rawText: "Hello from Postman!",
        headers: { "Content-Type": "text/plain", "x-upsert": "false" },
        preRequest: [
          "pm.environment.set('media_path', `${pm.environment.get('course_id')}/${pm.environment.get('lesson_key')}/${pm.variables.replaceIn('{{$guid}}')}-postman-notes.txt`);",
        ],
        description: "Uploads a small text file. To upload your own file, switch Body to 'binary' and change Content-Type.",
      },
      rpc("Register uploaded file", "add_lesson_media", {
        p_course_id: "{{course_id}}",
        p_lesson_key: "{{lesson_key}}",
        p_kind: "file",
        p_storage_path: "{{media_path}}",
        p_file_name: "postman-notes.txt",
        p_mime_type: "text/plain",
        p_size_bytes: 19,
      }, { saves: { media_id: "json" } }),
      rpc("Add a YouTube link as the lesson video", "add_lesson_media", {
        p_course_id: "{{course_id}}",
        p_lesson_key: "{{lesson_key}}",
        p_kind: "video_link",
        p_external_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      }, { description: "One video per lesson: a second call fails with a unique violation (409).", okStatuses: [200, 409] }),
      rest("List this course's media", "GET", "course_lesson_media?course_id=eq.{{course_id}}&select=id,kind,storage_path,external_url,file_name,size_bytes&order=position"),
      rpc("Get media paths", "lesson_media_paths", { p_course_id: "{{course_id}}", p_module_id: null, p_lesson_key: null }, {
        description: "Storage paths under a course (optionally one module or lesson). The app calls this before deleting so it can clean up the files.",
      }),
      {
        name: "Create signed URL",
        method: "POST",
        url: "{{supabase_url}}/storage/v1/object/sign/lesson-media/{{media_path}}",
        body: { expiresIn: 3600 },
        saves: { signed_url: "pm.environment.get('supabase_url') + '/storage/v1' + json.signedURL" },
        description: "Only works for users who may read the lesson (enrolled, owner, admin, or preview lessons).",
      },
      { name: "Download via signed URL", method: "GET", url: "{{signed_url}}", noAuth: true },
      rpc("Remove registered file", "remove_lesson_media", { p_media_id: "{{media_id}}" }, {
        description: "Deletes the media row and returns its storage path. Then delete the file itself (next request).",
      }),
      {
        name: "Delete file from Storage",
        method: "DELETE",
        url: "{{supabase_url}}/storage/v1/object/lesson-media",
        body: { prefixes: ["{{media_path}}"] },
      },
    ],
  },
  {
    name: "7. Admin (as Admin)",
    items: [
      rpc("Dashboard stats", "admin_stats"),
      rest("All courses (any status)", "GET", `courses?select=${ADMIN_COURSE_FIELDS}&order=title`),
      rest("Pending courses", "GET", "courses?status=eq.pending&select=id,title,description,category,instructor,price,status,owner_id&order=title"),
      approveCourse,
      rpc("Decline course", "admin_set_course_status", { p_course_id: "{{course_id}}", p_status: "declined" }),
      rpc("Update course", "admin_update_course", {
        p_course_id: "{{course_id}}",
        p_title: "Updated from Postman",
        p_description: "Edited by an admin.",
        p_category: "Testing",
        p_instructor: "Postman",
        p_price: 999,
        p_status: "approved",
        p_owner_id: "{{instructor_user_id}}",
        p_thumbnail: null,
      }, { description: "Changing p_owner_id transfers the course (the new owner becomes an instructor and gets access)." }),
      rpc("Rename module", "admin_update_module", { p_module_id: "{{module_id}}", p_title: "Renamed module" }),
      rpc("Move module down", "admin_move_module", { p_module_id: "{{module_id}}", p_direction: 1 }, {
        description: "p_direction: -1 = up, 1 = down. Moving past either end is an error.",
      }),
      rpc("Update lesson", "admin_update_lesson", {
        p_course_id: "{{course_id}}",
        p_lesson_key: "{{lesson_key}}",
        p_title: "Edited lesson",
        p_content: "Edited lesson text.",
        p_duration_minutes: 7,
        p_is_preview: true,
      }),
      rpc("Move lesson down", "admin_move_lesson", { p_course_id: "{{course_id}}", p_lesson_key: "{{lesson_key}}", p_direction: 1 }),
      rest(
        "Pending deletion requests",
        "GET",
        "course_deletion_requests?status=eq.pending&select=id,course_id,requested_by,status,requested_at,courses(title)&order=requested_at",
        undefined,
        { saves: { request_id: "json[0] && json[0].id" } }
      ),
      rpc("Decline deletion request", "admin_review_deletion", { p_request_id: "{{request_id}}", p_approve: false }),
      rpc("All users", "admin_list_users"),
      rpc("Update user (target)", "admin_update_user", {
        p_user_id: "{{target_user_id}}",
        p_name: "Learner (edited by admin)",
        p_is_instructor: false,
        p_is_admin: false,
      }, { description: "target_user_id defaults to the learner (set by 'Log in as Learner')." }),
      rpc("Ban user (target)", "admin_set_user_banned", { p_user_id: "{{target_user_id}}", p_banned: true }),
      rpc("Unban user (target)", "admin_set_user_banned", { p_user_id: "{{target_user_id}}", p_banned: false }),
      rpc("All enrollments", "admin_list_enrollments"),
      rest(
        "Enrollments of target user",
        "GET",
        "enrollments?user_id=eq.{{target_user_id}}&select=*,courses(id,title,category,instructor,status)&order=purchased_at.desc"
      ),
      rpc("Grant free access (365 days)", "admin_grant_enrollment", { p_user_id: "{{target_user_id}}", p_course_id: "{{course_id}}", p_days: 365 }),
      rpc("Set access expiry (+30 days)", "admin_set_enrollment_expiry", {
        p_user_id: "{{target_user_id}}",
        p_course_id: "{{course_id}}",
        p_expires_at: "{{expires_at}}",
      }, { preRequest: ["pm.environment.set('expires_at', new Date(Date.now() + 30 * 864e5).toISOString());"] }),
      rpc("Reset progress", "admin_reset_progress", { p_user_id: "{{target_user_id}}", p_course_id: "{{course_id}}" }),
      rpc("Revoke access", "admin_revoke_enrollment", { p_user_id: "{{target_user_id}}", p_course_id: "{{course_id}}" }, {
        description: "Ends access now but keeps the enrollment and progress; granting again restores it.",
      }),
    ],
  },
  {
    name: "8. ⚠ Admin danger zone (permanent)",
    description: "Irreversible deletes. Kept apart so a collection run never reaches them by accident.",
    items: [
      rpc("⚠ Delete lesson", "admin_delete_lesson", { p_course_id: "{{course_id}}", p_lesson_key: "{{lesson_key}}" }),
      rpc("⚠ Delete module", "admin_delete_module", { p_module_id: "{{module_id}}" }),
      rpc("⚠ Delete enrollment", "admin_delete_enrollment", { p_user_id: "{{target_user_id}}", p_course_id: "{{course_id}}" }),
      rpc("⚠ Approve deletion request (deletes the course)", "admin_review_deletion", { p_request_id: "{{request_id}}", p_approve: true }),
      deleteCourse,
      rpc("⚠ Delete user (target)", "admin_delete_user", { p_user_id: "{{target_user_id}}" }),
    ],
  },
  {
    name: "9. Security checks (should be refused)",
    description:
      "Each request is expected to FAIL; its test passes when Supabase refuses it. Needs a course_id owned by someone other than the learner.",
    items: [
      login("learner"),
      rpc("Learner calls admin_stats", "admin_stats", {}, { expectRefusal: "Admins only." }),
      rpc("Learner reads someone else's analytics", "course_analytics", { p_course_id: "{{course_id}}" }, {
        expectRefusal: "You can only view analytics for your own courses.",
      }),
      rest("Learner extends own access", "PATCH", "enrollments?course_id=eq.{{course_id}}", { expires_at: "2099-01-01T00:00:00Z" }, {
        expectRefusal: "permission denied",
      }),
      rest("Learner makes self admin", "PATCH", "profiles?id=eq.{{user_id}}", { is_admin: true }, { expectRefusal: "permission denied" }),
      rest("Learner reads lesson_activity", "GET", "lesson_activity?select=*", undefined, { expectRefusal: "permission denied" }),
      rpc("Anonymous call to an RPC", "course_students", { p_course_id: "{{course_id}}" }, { noAuth: true, expectRefusal: "" }),
    ],
  },
  {
    name: "10. Flow: course end to end (Collection Runner)",
    description:
      "Run this folder with the Collection Runner. Instructor creates a course → admin approves → learner enrols, completes a lesson and 'watches' → instructor reads the analytics → admin deletes the test course.",
    items: [
      login("instructor"),
      rpc("Become instructor", "become_instructor"),
      createCourse,
      getCurriculum,
      login("admin"),
      approveCourse,
      login("learner"),
      checkout,
      markComplete,
      heartbeat,
      login("instructor"),
      {
        ...analytics,
        extraTests: [
          "pm.test('learner is counted', () => pm.expect(pm.response.json().totals.enrolled).to.be.at.least(1));",
          "pm.test('someone is watching now', () => pm.expect(pm.response.json().totals.watchingNow).to.be.at.least(1));",
        ],
      },
      students,
      login("admin"),
      { ...deleteCourse, name: "Clean up: delete the test course" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Postman v2.1 output
// ---------------------------------------------------------------------------

// "{{supabase_url}}/rest/v1/courses?select=id" -> Postman's structured URL,
// so query parameters show up (and are editable) in the Params tab.
function toUrl(raw) {
  const [base, query] = raw.split("?");
  const [host, ...path] = base.split("/");
  const url = { raw, host: [host], path };
  if (query) {
    url.query = query.split("&").map((pair) => {
      const at = pair.indexOf("=");
      return at === -1 ? { key: pair, value: null } : { key: pair.slice(0, at), value: pair.slice(at + 1) };
    });
  }
  return url;
}

function testScript(req) {
  const lines = ["let json = null;", "try { json = pm.response.json(); } catch (e) {}"];
  if (req.expectRefusal !== undefined) {
    lines.push(
      "pm.test('request is refused', () => pm.expect(pm.response.code).to.be.at.least(400));",
      req.expectRefusal
        ? `pm.test('with the expected message', () => pm.expect(pm.response.text().toLowerCase()).to.include(${JSON.stringify(req.expectRefusal.toLowerCase())}));`
        : "// No message check: an anonymous caller is refused before the function runs."
    );
    return lines;
  }
  const ok = req.okStatuses;
  lines.push(
    ok
      ? `pm.test('status is ${ok.join(" or ")}', () => pm.expect(pm.response.code).to.be.oneOf(${JSON.stringify(ok)}));`
      : "pm.test('status is 2xx', () => pm.expect(pm.response.code).to.be.within(200, 299));"
  );
  for (const [key, expression] of Object.entries(req.saves ?? {})) {
    lines.push(
      `if (pm.response.code < 300 && json !== null) { const value = (${expression}); if (value !== undefined && value !== null && value !== false) pm.environment.set(${JSON.stringify(key)}, value); }`
    );
  }
  lines.push(...(req.extraTests ?? []));
  return lines;
}

function toItem(req) {
  const header = Object.entries(req.headers ?? {}).map(([key, value]) => ({ key, value }));
  if (req.prefer) header.push({ key: "Prefer", value: req.prefer });

  const request = { method: req.method, header, url: toUrl(req.url) };
  if (req.description) request.description = req.description;
  if (req.noAuth) request.auth = { type: "noauth" };
  if (req.rawText !== undefined) {
    request.body = { mode: "raw", raw: req.rawText, options: { raw: { language: "text" } } };
  } else if (req.body !== undefined || req.method === "POST") {
    request.body = { mode: "raw", raw: JSON.stringify(req.body ?? {}, null, 2), options: { raw: { language: "json" } } };
  }

  const event = [{ listen: "test", script: { type: "text/javascript", exec: testScript(req) } }];
  if (req.preRequest) event.unshift({ listen: "prerequest", script: { type: "text/javascript", exec: req.preRequest } });
  return { name: req.name, event, request };
}

// Every request gets the publishable key as `apikey` (never as the Bearer
// token: it isn't a JWT), and JSON bodies get their Content-Type.
const COLLECTION_PRE_REQUEST = [
  "pm.request.headers.upsert({ key: 'apikey', value: pm.variables.replaceIn('{{publishable_key}}') });",
  "if (pm.request.body && pm.request.body.mode === 'raw' && !pm.request.headers.has('Content-Type')) {",
  "  pm.request.headers.upsert({ key: 'Content-Type', value: 'application/json' });",
  "}",
];

const collection = {
  info: {
    _postman_id: "5f0c9a52-7e0b-4d1e-9b8a-2d6f3c1a9e41",
    name: "Gurukul (Supabase)",
    description: [
      "Every backend call the Gurukul app makes, straight to Supabase: Auth (/auth/v1), tables and RPCs (/rest/v1), Storage (/storage/v1).",
      "",
      "Start: pick the **Gurukul** environment, fill in its Current values, then run **1. Auth → Log in as …**. See frontend/postman/README.md.",
      "",
      "Generated by frontend/postman/build-collection.mjs. Edit that file, not this JSON.",
    ].join("\n"),
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: { type: "bearer", bearer: [{ key: "token", value: "{{access_token}}", type: "string" }] },
  event: [{ listen: "prerequest", script: { type: "text/javascript", exec: COLLECTION_PRE_REQUEST } }],
  item: folders.map((folder) => ({
    name: folder.name,
    ...(folder.description ? { description: folder.description } : {}),
    item: folder.items.map(toItem),
  })),
};

const ENV_VARS = [
  ["supabase_url", "https://YOUR-PROJECT.supabase.co", "default"],
  ["publishable_key", "sb_publishable_...", "secret"],
  ["captcha_token", "XXXX.DUMMY.TOKEN.XXXX", "default"],
  ["learner_email", "", "default"],
  ["learner_password", "", "secret"],
  ["instructor_email", "", "default"],
  ["instructor_password", "", "secret"],
  ["admin_email", "", "default"],
  ["admin_password", "", "secret"],
  ["signup_email", "", "default"],
  ["signup_password", "", "secret"],
  ["otp_code", "", "default"],
  ["new_password", "", "secret"],
  // Filled in by the requests' test scripts:
  ["access_token", "", "secret"],
  ["refresh_token", "", "secret"],
  ["user_id", "", "default"],
  ["learner_user_id", "", "default"],
  ["instructor_user_id", "", "default"],
  ["admin_user_id", "", "default"],
  ["target_user_id", "", "default"],
  ["course_id", "", "default"],
  ["module_id", "", "default"],
  ["lesson_key", "", "default"],
  ["media_path", "", "default"],
  ["media_id", "", "default"],
  ["signed_url", "", "default"],
  ["request_id", "", "default"],
  ["expires_at", "", "default"],
];

const environment = {
  id: "b8f2d1e4-3c6a-4f7b-9e2d-1a5c7e9b3d60",
  name: "Gurukul",
  values: ENV_VARS.map(([key, value, type]) => ({ key, value, type, enabled: true })),
  _postman_variable_scope: "environment",
};

writeFileSync(join(here, "Gurukul.postman_collection.json"), `${JSON.stringify(collection, null, 2)}\n`);
writeFileSync(join(here, "Gurukul.postman_environment.json"), `${JSON.stringify(environment, null, 2)}\n`);

// ---------------------------------------------------------------------------
// Coverage check: every public RPC in the SQL files is in the collection
// ---------------------------------------------------------------------------

const defined = new Set();
for (const file of readdirSync(sqlDir).filter((name) => name.endsWith(".sql"))) {
  for (const match of readFileSync(join(sqlDir, file), "utf8").matchAll(/create or replace function public\.(\w+)\s*\(/gi)) {
    defined.add(match[1]);
  }
}
const missing = [...defined].filter((name) => !rpcNames.has(name)).sort();
const unknown = [...rpcNames].filter((name) => !defined.has(name)).sort();
const requestCount = collection.item.reduce((sum, folder) => sum + folder.item.length, 0);

console.log(`Wrote ${requestCount} requests in ${collection.item.length} folders.`);
console.log(`RPCs: ${rpcNames.size} in the collection, ${defined.size} defined in supabase/*.sql.`);
if (unknown.length) console.log(`Not defined in SQL (check the name): ${unknown.join(", ")}`);
if (missing.length) {
  console.error(`Missing from the collection: ${missing.join(", ")}`);
  process.exit(1);
}
