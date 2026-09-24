-- Phase 5b — Supabase Auth profiles, RLS policies, RPC functions.
-- Run this in the Supabase SQL editor after phase5a-lockdown.sql.
-- Additive only: the old custom-auth app keeps working. The only visible
-- change is that course_lessons.content becomes nullable (lesson text now
-- lives in course_lesson_content; the old column is dropped at cutover).

-- ---------------------------------------------------------------------------
-- 1. Private schema and profiles
-- ---------------------------------------------------------------------------

-- `private` is NOT exposed by the Data API (never add it to exposed schemas).
create schema if not exists private;
grant usage on schema private to authenticated;
grant usage on schema private to supabase_auth_admin;

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default 'Learner',
  is_instructor boolean not null default false,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- One profile per auth user. Only `name` comes from user metadata (users can
-- edit their own metadata, so roles must never be read from it). coalesce
-- avoids inserting NULL, which would abort signup with "Database error saving new user".
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Learner'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Schema changes
-- ---------------------------------------------------------------------------

-- A course that doesn't set a status must never be published immediately.
alter table public.courses alter column status set default 'pending';

-- Free preview lessons.
alter table public.course_lessons add column if not exists is_preview boolean not null default false;

-- Lesson text moves to its own table so it can be locked separately from the outline.
create table if not exists public.course_lesson_content (
  lesson_id uuid primary key references public.course_lessons(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  content   text not null
);
alter table public.course_lesson_content enable row level security;

create index if not exists course_lesson_content_course_id_idx on public.course_lesson_content (course_id);

insert into public.course_lesson_content (lesson_id, course_id, content)
select id, course_id, content from public.course_lessons where content is not null
on conflict (lesson_id) do nothing;

-- New code writes content only to course_lesson_content; the old column is dropped at cutover.
alter table public.course_lessons alter column content drop not null;

-- One pending deletion request per course (drop any existing duplicates first, keeping the oldest).
delete from public.course_deletion_requests r
using public.course_deletion_requests older
where r.status = 'pending' and older.status = 'pending'
  and r.course_id = older.course_id
  and (r.requested_at, r.id) > (older.requested_at, older.id);

create unique index if not exists course_deletion_requests_one_pending_idx
  on public.course_deletion_requests (course_id) where status = 'pending';

-- The browser never sends user ids; the database fills them in.
alter table public.lesson_progress          alter column user_id      set default auth.uid();
alter table public.course_deletion_requests alter column requested_by set default auth.uid();

-- ---------------------------------------------------------------------------
-- 3. Helper functions used by the policies
-- ---------------------------------------------------------------------------
-- security definer + owner postgres = these read tables without re-triggering
-- RLS (which would otherwise recurse). They live in `private`.

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;

create or replace function private.is_instructor()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_instructor from public.profiles p where p.id = (select auth.uid())), false);
$$;

create or replace function private.owns_course(cid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.courses c where c.id = cid and c.owner_id = (select auth.uid()));
$$;

create or replace function private.has_active_enrollment(cid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = cid and e.user_id = (select auth.uid())
      and e.status = 'active' and e.expires_at > now()
  );
$$;

-- Approved courses are visible to every signed-in user; pending/declined only to
-- the owner, admins, or someone already enrolled (same as the old my-learning route).
create or replace function private.can_view_course(cid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.courses c where c.id = cid and c.status = 'approved')
      or private.owns_course(cid)
      or private.is_admin()
      or private.has_active_enrollment(cid);
$$;

create or replace function private.lesson_in_course(cid text, lkey text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.course_lessons l where l.course_id = cid and l.lesson_key = lkey);
$$;

create or replace function private.lesson_is_preview(lid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select l.is_preview from public.course_lessons l where l.id = lid), false);
$$;

-- ---------------------------------------------------------------------------
-- 4. Table grants and RLS policies
-- ---------------------------------------------------------------------------
-- RLS filters rows; grants decide which operations/columns are allowed at all.
grant select                on public.profiles                 to authenticated;
grant update (name)         on public.profiles                 to authenticated;
grant select                on public.courses                  to authenticated;
grant select                on public.course_modules           to authenticated;
grant select (id, module_id, course_id, lesson_key, title, duration_minutes, position, is_preview, created_at)
                            on public.course_lessons           to authenticated;  -- never `content`
grant select                on public.course_lesson_content    to authenticated;
grant select                on public.enrollments              to authenticated;
grant select                on public.lesson_progress          to authenticated;
grant insert (course_id, lesson_id) on public.lesson_progress  to authenticated;
grant select                on public.course_deletion_requests to authenticated;
grant insert (course_id)    on public.course_deletion_requests to authenticated;
-- No grants at all on users / otp_codes / login_attempts (legacy) and none to anon.

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- courses: read-only from the browser; all writes go through RPCs
drop policy if exists "courses_select_visible" on public.courses;
create policy "courses_select_visible" on public.courses
  for select to authenticated
  using (
    status = 'approved'
    or owner_id = (select auth.uid())
    or (select private.is_admin())
    or private.has_active_enrollment(id)
  );

-- curriculum outline
drop policy if exists "course_modules_select_visible" on public.course_modules;
create policy "course_modules_select_visible" on public.course_modules
  for select to authenticated using (private.can_view_course(course_id));

drop policy if exists "course_lessons_select_visible" on public.course_lessons;
create policy "course_lessons_select_visible" on public.course_lessons
  for select to authenticated using (private.can_view_course(course_id));

-- lesson text: preview lessons, or enrolled / owner / admin
drop policy if exists "course_lesson_content_select_allowed" on public.course_lesson_content;
create policy "course_lesson_content_select_allowed" on public.course_lesson_content
  for select to authenticated
  using (
    private.can_view_course(course_id)
    and (
      private.lesson_is_preview(lesson_id)
      or private.has_active_enrollment(course_id)
      or private.owns_course(course_id)
      or (select private.is_admin())
    )
  );

-- enrollments: read own only; writes only via checkout()/create_course()
drop policy if exists "enrollments_select_own" on public.enrollments;
create policy "enrollments_select_own" on public.enrollments
  for select to authenticated using (user_id = (select auth.uid()));

-- lesson progress: read own; mark a lesson done only with an active enrollment and a real lesson
drop policy if exists "lesson_progress_select_own" on public.lesson_progress;
create policy "lesson_progress_select_own" on public.lesson_progress
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "lesson_progress_insert_own_enrolled" on public.lesson_progress;
create policy "lesson_progress_insert_own_enrolled" on public.lesson_progress
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.has_active_enrollment(course_id)
    and private.lesson_in_course(course_id, lesson_id)
  );

-- deletion requests: owner requests, owner/admin reads
drop policy if exists "deletion_requests_select_own_or_admin" on public.course_deletion_requests;
create policy "deletion_requests_select_own_or_admin" on public.course_deletion_requests
  for select to authenticated
  using (requested_by = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "deletion_requests_insert_owner" on public.course_deletion_requests;
create policy "deletion_requests_insert_owner" on public.course_deletion_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and status = 'pending'
    and private.owns_course(course_id)
  );

-- ---------------------------------------------------------------------------
-- 5. Validation and insert helpers (private, used only by the RPCs)
-- ---------------------------------------------------------------------------
-- Ported from src/lib/server/courseContent.js — same error messages.

create or replace function private.validate_lesson(p_lesson jsonb)
returns void language plpgsql set search_path = '' as $$
begin
  if coalesce(trim(p_lesson ->> 'title'), '') = '' or coalesce(trim(p_lesson ->> 'content'), '') = '' then
    raise exception 'Every lesson needs a title and content.' using errcode = '22023';
  end if;
end;
$$;

create or replace function private.validate_module(p_module jsonb)
returns void language plpgsql set search_path = '' as $$
declare v_lesson jsonb;
begin
  if coalesce(trim(p_module ->> 'title'), '') = '' then
    raise exception 'Every module needs a title.' using errcode = '22023';
  end if;
  if coalesce(jsonb_typeof(p_module -> 'lessons'), '') <> 'array' or jsonb_array_length(p_module -> 'lessons') = 0 then
    raise exception 'Every module needs at least one lesson.' using errcode = '22023';
  end if;
  for v_lesson in select * from jsonb_array_elements(p_module -> 'lessons') loop
    perform private.validate_lesson(v_lesson);
  end loop;
end;
$$;

create or replace function private.validate_modules(p_modules jsonb)
returns void language plpgsql set search_path = '' as $$
declare v_module jsonb;
begin
  if coalesce(jsonb_typeof(p_modules), '') <> 'array' or jsonb_array_length(p_modules) = 0 then
    raise exception 'At least one module is required.' using errcode = '22023';
  end if;
  for v_module in select * from jsonb_array_elements(p_modules) loop
    perform private.validate_module(v_module);
  end loop;
end;
$$;

-- lesson_key format "module-<modulePos>-lesson-<lessonPos>" is unchanged:
-- lesson_progress.lesson_id stores it, so existing progress rows keep matching.
create or replace function private.insert_lesson(
  p_course_id text, p_module_id uuid, p_module_pos int, p_pos int, p_lesson jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.course_lessons (module_id, course_id, lesson_key, title, duration_minutes, position, is_preview)
  values (
    p_module_id, p_course_id,
    format('module-%s-lesson-%s', p_module_pos, p_pos),
    trim(p_lesson ->> 'title'),
    case when jsonb_typeof(p_lesson -> 'durationMinutes') = 'number'
         then greatest(1, round((p_lesson ->> 'durationMinutes')::numeric)::int) else 10 end,
    p_pos,
    coalesce((p_lesson ->> 'isPreview')::boolean, false)
  )
  returning id into v_id;

  insert into public.course_lesson_content (lesson_id, course_id, content)
  values (v_id, p_course_id, trim(p_lesson ->> 'content'));
  return v_id;
end;
$$;

create or replace function private.insert_module(p_course_id text, p_module jsonb, p_position int)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_module_id uuid; v_lesson jsonb; v_pos int := 0;
begin
  insert into public.course_modules (course_id, title, position)
  values (p_course_id, trim(p_module ->> 'title'), p_position)
  returning id into v_module_id;

  for v_lesson in select * from jsonb_array_elements(p_module -> 'lessons') loop
    v_pos := v_pos + 1;
    perform private.insert_lesson(p_course_id, v_module_id, p_position, v_pos, v_lesson);
  end loop;
  return v_module_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. RPC functions (public, called with supabase.rpc(...))
-- ---------------------------------------------------------------------------
-- Every RPC: security definer, empty search_path, caller = auth.uid() (never a
-- parameter). Each call runs as one transaction, so a failure part-way rolls
-- everything back.

create or replace function public.create_course(
  p_title text, p_description text, p_category text, p_price integer, p_modules jsonb
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_base text;
  v_id text;
  v_suffix int := 2;
  v_module jsonb;
  v_module_pos int := 0;
begin
  if v_uid is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not private.is_instructor() then
    raise exception 'Only instructors can create courses.' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_description), '') = '' or coalesce(trim(p_category), '') = '' then
    raise exception 'Title, description, and category are required.' using errcode = '22023';
  end if;
  if p_price is null or p_price < 0 then
    raise exception 'Price must be a non-negative number.' using errcode = '22023';
  end if;
  perform private.validate_modules(p_modules);

  select p.name into v_name from public.profiles p where p.id = v_uid;

  -- same slug rule as the old slugify(): lowercase, non-alphanumerics -> "-", trim dashes
  v_base := trim(both '-' from regexp_replace(lower(trim(p_title)), '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then v_base := 'course'; end if;
  v_id := v_base;
  while exists (select 1 from public.courses c where c.id = v_id) loop
    v_id := v_base || '-' || v_suffix;
    v_suffix := v_suffix + 1;
  end loop;

  insert into public.courses (id, title, description, category, instructor, price, owner_id, status)
  values (v_id, trim(p_title), trim(p_description), trim(p_category),
          coalesce(v_name, 'Unknown Instructor'), p_price, v_uid, 'pending');

  for v_module in select * from jsonb_array_elements(p_modules) loop
    v_module_pos := v_module_pos + 1;
    perform private.insert_module(v_id, v_module, v_module_pos);
  end loop;

  -- the creator always has access to their own course
  insert into public.enrollments (user_id, course_id, status, purchased_at, expires_at)
  values (v_uid, v_id, 'active', now(), now() + interval '365 days');

  return v_id;
end;
$$;

create or replace function public.add_module(p_course_id text, p_title text, p_lessons jsonb)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_module jsonb; v_pos int;
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception 'Course not found.' using errcode = 'P0002';
  end if;
  if not private.owns_course(p_course_id) then
    raise exception 'You don''t own this course.' using errcode = '42501';
  end if;

  v_module := jsonb_build_object('title', p_title, 'lessons', p_lessons);
  perform private.validate_module(v_module);

  select coalesce(max(m.position), 0) + 1 into v_pos from public.course_modules m where m.course_id = p_course_id;
  return private.insert_module(p_course_id, v_module, v_pos);
end;
$$;

create or replace function public.add_lesson(
  p_course_id text, p_module_id uuid, p_title text, p_content text,
  p_duration_minutes integer default null, p_is_preview boolean default false
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_module_pos int; v_pos int; v_lesson jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception 'Course not found.' using errcode = 'P0002';
  end if;
  if not private.owns_course(p_course_id) then
    raise exception 'You don''t own this course.' using errcode = '42501';
  end if;

  select m.position into v_module_pos
  from public.course_modules m where m.id = p_module_id and m.course_id = p_course_id;
  if v_module_pos is null then raise exception 'Module not found.' using errcode = 'P0002'; end if;

  v_lesson := jsonb_build_object('title', p_title, 'content', p_content,
                                 'durationMinutes', p_duration_minutes, 'isPreview', p_is_preview);
  perform private.validate_lesson(v_lesson);

  select coalesce(max(l.position), 0) + 1 into v_pos from public.course_lessons l where l.module_id = p_module_id;
  return private.insert_lesson(p_course_id, p_module_id, v_module_pos, v_pos, v_lesson);
end;
$$;

-- Mock purchase: first purchase or renewal. progress_percent is never touched.
create or replace function public.checkout(p_course_id text)
returns public.enrollments
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_row public.enrollments;
begin
  if v_uid is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id and c.status = 'approved') then
    raise exception 'Course not found.' using errcode = 'P0002';
  end if;

  insert into public.enrollments (user_id, course_id, status, purchased_at, expires_at)
  values (v_uid, p_course_id, 'active', now(), now() + interval '365 days')
  on conflict (user_id, course_id) do update
    set status = 'active', purchased_at = excluded.purchased_at, expires_at = excluded.expires_at
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.become_instructor()
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  update public.profiles set is_instructor = true where id = auth.uid();
end;
$$;

create or replace function public.admin_set_course_status(p_course_id text, p_status text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  if p_status not in ('approved', 'declined') then
    raise exception 'Invalid status.' using errcode = '22023';
  end if;
  update public.courses set status = p_status where id = p_course_id;
  if not found then raise exception 'Course not found.' using errcode = 'P0002'; end if;
end;
$$;

-- Approve = hard-delete the course (cascades modules, lessons, content, every
-- learner's enrollments/progress, and the request row itself), same as before.
create or replace function public.admin_review_deletion(p_request_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare v_req public.course_deletion_requests;
begin
  if not private.is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;

  select * into v_req from public.course_deletion_requests r where r.id = p_request_id for update;
  if not found then raise exception 'Deletion request not found.' using errcode = 'P0002'; end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been reviewed.' using errcode = '22023';
  end if;

  if p_approve then
    delete from public.courses where id = v_req.course_id;
  else
    update public.course_deletion_requests set status = 'declined', reviewed_at = now() where id = p_request_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Progress trigger (ported from api/enrollments/[courseId]/progress)
-- ---------------------------------------------------------------------------
create or replace function private.recalc_progress()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_total int; v_done int;
begin
  select count(*) into v_total from public.course_lessons l where l.course_id = new.course_id;
  select count(*) into v_done  from public.lesson_progress p
    where p.user_id = new.user_id and p.course_id = new.course_id;

  update public.enrollments
     set progress_percent = case when v_total = 0 then 0
                                 else least(100, round(v_done * 100.0 / v_total)::int) end
   where user_id = new.user_id and course_id = new.course_id;
  return null;
end;
$$;

drop trigger if exists lesson_progress_recalc on public.lesson_progress;
create trigger lesson_progress_recalc
  after insert on public.lesson_progress
  for each row execute function private.recalc_progress();

-- ---------------------------------------------------------------------------
-- 8. Function privileges
-- ---------------------------------------------------------------------------
-- Nothing in `private` is callable by default; policies run as the calling
-- user, so `authenticated` needs EXECUTE on the helpers they reference.
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.is_admin(), private.is_instructor(), private.owns_course(text),
  private.has_active_enrollment(text), private.can_view_course(text),
  private.lesson_in_course(text, text), private.lesson_is_preview(uuid)
to authenticated;

-- Supabase grants EXECUTE to anon directly, so revoke from anon by name as well as from public.
revoke execute on function
  public.create_course(text, text, text, integer, jsonb),
  public.add_module(text, text, jsonb),
  public.add_lesson(text, uuid, text, text, integer, boolean),
  public.checkout(text),
  public.become_instructor(),
  public.admin_set_course_status(text, text),
  public.admin_review_deletion(uuid, boolean)
from public, anon;

grant execute on function
  public.create_course(text, text, text, integer, jsonb),
  public.add_module(text, text, jsonb),
  public.add_lesson(text, uuid, text, text, integer, boolean),
  public.checkout(text),
  public.become_instructor(),
  public.admin_set_course_status(text, text),
  public.admin_review_deletion(uuid, boolean)
to authenticated;
