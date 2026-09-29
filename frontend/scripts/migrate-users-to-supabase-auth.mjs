// One-off migration: copies every row of the legacy custom-auth `users` table
// into Supabase Auth, keeping the same user id and the same bcrypt password
// hash (so existing passwords keep working), then copies roles into profiles.
//
// Run from frontend/ (needs SUPABASE_URL and SUPABASE_SECRET_KEY):
//   node --env-file=.env.local scripts/migrate-users-to-supabase-auth.mjs
//
// Safe to re-run: accounts that already exist in Supabase Auth are skipped,
// and their profile roles are re-synced. After cutover the legacy table is
// renamed, so pass LEGACY_USERS_TABLE=legacy_users to run it again then.
import { createClient } from "@supabase/supabase-js";

const SOURCE_TABLE = process.env.LEGACY_USERS_TABLE ?? "users";
const PAGE_SIZE = 1000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function loadAllUsers() {
  const all = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(SOURCE_TABLE)
      .select("id, name, email, password_hash, email_verified_at, is_instructor, is_admin")
      .order("created_at")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE_SIZE) return all;
  }
}

const users = await loadAllUsers();

// Supabase Auth lowercases emails: two legacy rows differing only by case would collide.
const byEmail = new Map();
const duplicates = [];
for (const user of users) {
  const key = user.email.trim().toLowerCase();
  if (byEmail.has(key)) duplicates.push(`${byEmail.get(key)} / ${user.email}`);
  byEmail.set(key, user.email);
}
const badHashes = users.filter((user) => !/^\$2[aby]\$\d{2}\$/.test(user.password_hash));

if (duplicates.length || badHashes.length) {
  console.error("Fix these before migrating:");
  duplicates.forEach((pair) => console.error("  duplicate email:", pair));
  badHashes.forEach((user) => console.error("  non-bcrypt hash:", user.email));
  process.exit(1);
}

let created = 0;
let alreadyThere = 0;
let failed = 0;

for (const user of users) {
  const { error: createError } = await supabase.auth.admin.createUser({
    id: user.id,
    email: user.email.trim().toLowerCase(),
    password_hash: user.password_hash,
    email_confirm: user.email_verified_at !== null,
    user_metadata: { name: user.name },
  });

  if (createError) {
    if (createError.code === "email_exists" || /already.*registered/i.test(createError.message)) {
      alreadyThere += 1;
    } else {
      failed += 1;
      console.error(`createUser failed for ${user.email}: ${createError.message}`);
      continue;
    }
  } else {
    created += 1;
  }

  // The auth trigger created the profile; copy the roles across (on re-runs too).
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    name: user.name,
    is_instructor: user.is_instructor,
    is_admin: user.is_admin,
  });
  if (profileError) {
    failed += 1;
    console.error(`profile upsert failed for ${user.email}: ${profileError.message}`);
  }
}

console.log({ total: users.length, created, alreadyThere, failed });
if (failed) process.exit(1);
