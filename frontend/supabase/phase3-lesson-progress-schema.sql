-- Phase 3 — Lesson Progress & Cutover
-- Run this in the Supabase SQL editor after phase1-auth-schema.sql and
-- phase2-courses-schema.sql.

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, course_id, lesson_id)
);

create index if not exists lesson_progress_user_course_idx on lesson_progress (user_id, course_id);
