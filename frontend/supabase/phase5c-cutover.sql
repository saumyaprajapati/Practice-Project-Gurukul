-- Phase 5c — cutover. Run immediately before deploying the new frontend,
-- after re-running scripts/migrate-users-to-supabase-auth.mjs one last time.
-- Old gurukul_session cookies stop working: every user signs in once more.
-- Rollback: restore the backup taken before phase 5a.

-- 0) Every count must be 0, otherwise re-run the migration script first.
select 'enrollments' as table_name, count(*) from public.enrollments e
  where not exists (select 1 from public.profiles p where p.id = e.user_id)
union all
select 'lesson_progress', count(*) from public.lesson_progress l
  where not exists (select 1 from public.profiles p where p.id = l.user_id)
union all
select 'courses.owner_id', count(*) from public.courses c
  where c.owner_id is not null and not exists (select 1 from public.profiles p where p.id = c.owner_id)
union all
select 'deletion_requests', count(*) from public.course_deletion_requests r
  where not exists (select 1 from public.profiles p where p.id = r.requested_by);

begin;

-- 1) Point user foreign keys at profiles (ids are unchanged, so rows stay valid).
--    Check the real constraint names first (see README-phase5.md, step 0).
alter table public.enrollments
  drop constraint if exists enrollments_user_id_fkey,
  add  constraint enrollments_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.lesson_progress
  drop constraint if exists lesson_progress_user_id_fkey,
  add  constraint lesson_progress_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.courses
  drop constraint if exists courses_owner_id_fkey,
  add  constraint courses_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete set null;
alter table public.course_deletion_requests
  drop constraint if exists course_deletion_requests_requested_by_fkey,
  add  constraint course_deletion_requests_requested_by_fkey foreign key (requested_by) references public.profiles(id) on delete cascade;

-- 2) Copy lesson text written by the old app since phase 5b, then remove the column.
insert into public.course_lesson_content (lesson_id, course_id, content)
select id, course_id, content from public.course_lessons where content is not null
on conflict (lesson_id) do nothing;
alter table public.course_lessons drop column content;

-- 3) Retire the custom-auth tables (RLS on + no grants since phase 5a, so unreadable).
--    Drop them a week or so later once everything checks out.
alter table public.users          rename to legacy_users;
alter table public.otp_codes      rename to legacy_otp_codes;
alter table public.login_attempts rename to legacy_login_attempts;

commit;
