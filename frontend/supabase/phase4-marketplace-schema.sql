-- Phase 4 — Course Marketplace (Instructor role, real curriculum, admin approval)
-- Run this in the Supabase SQL editor after phase1/2/3. After running it,
-- flag your own test account as an admin directly (self-service admin
-- promotion is out of scope for this prototype):
--   update users set is_admin = true where email = 'you@example.com';

alter table users
  add column if not exists is_instructor boolean not null default false,
  add column if not exists is_admin boolean not null default false;

alter table courses
  add column if not exists owner_id uuid references users(id) on delete set null,
  add column if not exists status text not null default 'approved'
    check (status in ('pending', 'approved', 'declined'));

create index if not exists courses_status_idx on courses (status);
create index if not exists courses_owner_id_idx on courses (owner_id);

create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references courses(id) on delete cascade,
  title text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (course_id, position)
);

create index if not exists course_modules_course_id_idx on course_modules (course_id);

create table if not exists course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references course_modules(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  lesson_key text not null,
  title text not null,
  content text not null,
  duration_minutes integer not null default 10,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (course_id, lesson_key),
  unique (module_id, position)
);

create index if not exists course_lessons_module_id_idx on course_lessons (module_id);
create index if not exists course_lessons_course_id_idx on course_lessons (course_id);

create table if not exists course_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references courses(id) on delete cascade,
  requested_by uuid not null references users(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists course_deletion_requests_status_idx on course_deletion_requests (status);

-- Backfill: gives every existing (legacy, ownerless) course the exact same
-- 4-module/9-lesson placeholder curriculum lib/courses/curriculum.js's
-- generator used to produce on the fly, using the same deterministic
-- lesson_key values ("module-1-lesson-1", etc.) so already-recorded
-- lesson_progress rows from Phase 2/3 testing keep matching real lessons.
-- Only runs for courses that don't already have modules (safe to re-run).
do $$
declare
  course_row record;
  archetypes jsonb := '[
    {"title":"Getting Started","lessons":[{"title":"Welcome and Course Overview","duration":8},{"title":"Setting Up Your Environment","duration":12}]},
    {"title":"Core Concepts","lessons":[{"title":"Foundational Ideas","duration":15},{"title":"Key Terminology and Mental Models","duration":12},{"title":"Common Pitfalls to Avoid","duration":10}]},
    {"title":"Hands-on Practice","lessons":[{"title":"Worked Example, Step by Step","duration":18},{"title":"Building Something Real","duration":20}]},
    {"title":"Review and Next Steps","lessons":[{"title":"Putting It All Together","duration":14},{"title":"Where to Go From Here","duration":9}]}
  ]'::jsonb;
  module_elem jsonb;
  lesson_elem jsonb;
  module_index int;
  lesson_index int;
  new_module_id uuid;
  lesson_title text;
  lesson_duration int;
  lesson_key text;
  content_text text;
begin
  for course_row in
    select id, title, instructor, category from courses
    where not exists (select 1 from course_modules where course_modules.course_id = courses.id)
  loop
    module_index := 0;
    for module_elem in select * from jsonb_array_elements(archetypes) loop
      module_index := module_index + 1;
      insert into course_modules (course_id, title, position)
        values (course_row.id, format('Module %s: %s', module_index, module_elem->>'title'), module_index)
        returning id into new_module_id;

      lesson_index := 0;
      for lesson_elem in select * from jsonb_array_elements(module_elem->'lessons') loop
        lesson_index := lesson_index + 1;
        lesson_title := lesson_elem->>'title';
        lesson_duration := (lesson_elem->>'duration')::int;
        lesson_key := format('module-%s-lesson-%s', module_index, lesson_index);
        content_text := format(
          'This lesson is part of "%s" in %s, taught by %s.' || E'\n\n' ||
          '"%s" builds on what you''ve covered so far in %s. In a full version of this course, this space would hold real reading material, examples, and media specific to %s.' || E'\n\n' ||
          'For now, treat this as a placeholder: the structure of the course — its modules and lessons — is real and navigable, but the lesson content itself is mock text standing in for authored material.',
          module_elem->>'title', course_row.title, course_row.instructor,
          lesson_title, course_row.category, course_row.title
        );
        insert into course_lessons (module_id, course_id, lesson_key, title, content, duration_minutes, position)
          values (new_module_id, course_row.id, lesson_key, lesson_title, content_text, lesson_duration, lesson_index);
      end loop;
    end loop;
  end loop;
end $$;
