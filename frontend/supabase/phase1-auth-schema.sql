-- Phase 1 (Foundation, DB & Auth) — run once in the Supabase SQL editor.
-- Tables for courses/enrollments/lesson_progress are added in later phases.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  email_verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references users(id) on delete cascade,
  email text not null,
  code text not null,
  intent text not null check (intent in ('signup', 'recovery')),
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists otp_codes_email_intent_idx on otp_codes (email, intent);

-- A minimal, DB-backed login-attempt counter (see plan's "guardrails" —
-- explicitly not production-grade rate limiting, just enough to slow down
-- naive brute forcing since Next.js API routes can't rely on in-memory
-- state surviving across invocations).
create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_email_idx on login_attempts (email, attempted_at);
