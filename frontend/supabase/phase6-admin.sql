-- Phase 6 — Admin "god mode": full management of courses, content, users and
-- enrollments. Run in the Supabase SQL editor after phase5a/5b/5c.
-- Safe to re-run.
--
-- Every admin_* RPC is security definer, checks private.require_admin() first
-- and is callable only by `authenticated` (never anon). Guard rails that keep
-- at least one admin around: an admin can't demote, ban or delete themself,
-- and another admin must be demoted before they can be banned or deleted.

-- ---------------------------------------------------------------------------
-- 1. Schema
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists banned_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Private helpers
-- ---------------------------------------------------------------------------

-- A banned admin loses admin powers immediately (on their next request).
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.is_admin and p.banned_at is null from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

create or replace function private.require_admin()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not private.is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
end;
$$;

-- Recomputes progress_percent for every enrollment in a course (used when
-- the course's lesson count changes, not just when a lesson is completed).
create or replace function private.recalc_course_progress(cid text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_total int;
begin
  select count(*) into v_total from public.course_lessons l where l.course_id = cid;
  update public.enrollments e
     set progress_percent = case when v_total = 0 then 0 else least(100, round(
           (select count(*) from public.lesson_progress p where p.course_id = cid and p.user_id = e.user_id)
           * 100.0 / v_total)::int) end
   where e.course_id = cid;
end;
$$;

-- lesson_key must stay unique per course even after lessons are deleted or
-- modules reordered, so a colliding "module-N-lesson-M" gets a random suffix.
create or replace function private.insert_lesson(
  p_course_id text, p_module_id uuid, p_module_pos int, p_pos int, p_lesson jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_key text;
begin
  v_key := format('module-%s-lesson-%s', p_module_pos, p_pos);
  while exists (select 1 from public.course_lessons l where l.course_id = p_course_id and l.lesson_key = v_key) loop
    v_key := format('module-%s-lesson-%s-%s', p_module_pos, p_pos, substr(md5(random()::text), 1, 6));
  end loop;

  insert into public.course_lessons (module_id, course_id, lesson_key, title, duration_minutes, position, is_preview)
  values (
    p_module_id, p_course_id, v_key,
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

-- ---------------------------------------------------------------------------
-- 3. Keep progress consistent when lessons are added or removed
-- ---------------------------------------------------------------------------

create or replace function private.after_lessons_inserted()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_course text;
begin
  for v_course in select distinct n.course_id from new_rows n loop
    perform private.recalc_course_progress(v_course);
  end loop;
  return null;
end;
$$;

-- Removes progress rows that pointed at a deleted lesson (they'd otherwise
-- count again if a new lesson ever reused the key), then recalculates.
create or replace function private.after_lessons_deleted()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_course text;
begin
  delete from public.lesson_progress p
   using old_rows o
   where p.course_id = o.course_id and p.lesson_id = o.lesson_key;
  for v_course in select distinct o.course_id from old_rows o loop
    perform private.recalc_course_progress(v_course);
  end loop;
  return null;
end;
$$;

drop trigger if exists course_lessons_after_insert on public.course_lessons;
create trigger course_lessons_after_insert
  after insert on public.course_lessons
  referencing new table as new_rows
  for each statement execute function private.after_lessons_inserted();

drop trigger if exists course_lessons_after_delete on public.course_lessons;
create trigger course_lessons_after_delete
  after delete on public.course_lessons
  referencing old table as old_rows
  for each statement execute function private.after_lessons_deleted();

-- ---------------------------------------------------------------------------
-- 4. Admin read access (course list shows enrollment counts)
-- ---------------------------------------------------------------------------

drop policy if exists "enrollments_select_admin" on public.enrollments;
create policy "enrollments_select_admin" on public.enrollments
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "lesson_progress_select_admin" on public.lesson_progress;
create policy "lesson_progress_select_admin" on public.lesson_progress
  for select to authenticated using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- 5. Owner-or-admin content appends (replaces the owner-only versions)
-- ---------------------------------------------------------------------------

create or replace function public.add_module(p_course_id text, p_title text, p_lessons jsonb)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_module jsonb; v_pos int;
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception 'Course not found.' using errcode = 'P0002';
  end if;
  if not (private.owns_course(p_course_id) or private.is_admin()) then
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
  if not (private.owns_course(p_course_id) or private.is_admin()) then
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

-- ---------------------------------------------------------------------------
-- 6. Dashboard
-- ---------------------------------------------------------------------------

create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_admin();
  return jsonb_build_object(
    'users',               (select count(*) from public.profiles),
    'instructors',         (select count(*) from public.profiles p where p.is_instructor),
    'admins',              (select count(*) from public.profiles p where p.is_admin),
    'banned',              (select count(*) from public.profiles p where p.banned_at is not null),
    'courses',             (select count(*) from public.courses),
    'approvedCourses',     (select count(*) from public.courses c where c.status = 'approved'),
    'pendingCourses',      (select count(*) from public.courses c where c.status = 'pending'),
    'declinedCourses',     (select count(*) from public.courses c where c.status = 'declined'),
    'pendingDeletions',    (select count(*) from public.course_deletion_requests r where r.status = 'pending'),
    'activeEnrollments',   (select count(*) from public.enrollments e where e.status = 'active' and e.expires_at > now()),
    'lessonsCompleted',    (select count(*) from public.lesson_progress)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Courses and content
-- ---------------------------------------------------------------------------

-- Edits every course field except its id (the id is the URL slug and is
-- referenced everywhere). Transferring ownership makes the new owner an
-- instructor and gives them access, like create_course does for a creator.
create or replace function public.admin_update_course(
  p_course_id text, p_title text, p_description text, p_category text, p_instructor text,
  p_price integer, p_status text, p_owner_id uuid, p_thumbnail text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_old_owner uuid;
begin
  perform private.require_admin();
  select c.owner_id into v_old_owner from public.courses c where c.id = p_course_id;
  if not found then raise exception 'Course not found.' using errcode = 'P0002'; end if;

  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_description), '') = ''
     or coalesce(trim(p_category), '') = '' or coalesce(trim(p_instructor), '') = '' then
    raise exception 'Title, description, category, and instructor are required.' using errcode = '22023';
  end if;
  if p_price is null or p_price < 0 then
    raise exception 'Price must be a non-negative number.' using errcode = '22023';
  end if;
  if p_status not in ('pending', 'approved', 'declined') then
    raise exception 'Invalid status.' using errcode = '22023';
  end if;
  if p_owner_id is not null and not exists (select 1 from public.profiles p where p.id = p_owner_id) then
    raise exception 'New owner not found.' using errcode = 'P0002';
  end if;

  update public.courses
     set title = trim(p_title), description = trim(p_description), category = trim(p_category),
         instructor = trim(p_instructor), price = p_price, status = p_status, owner_id = p_owner_id,
         thumbnail = nullif(trim(coalesce(p_thumbnail, '')), '')
   where id = p_course_id;

  if p_owner_id is not null and p_owner_id is distinct from v_old_owner then
    update public.profiles set is_instructor = true where id = p_owner_id;
    insert into public.enrollments (user_id, course_id, status, purchased_at, expires_at)
    values (p_owner_id, p_course_id, 'active', now(), now() + interval '365 days')
    on conflict (user_id, course_id) do update
      set status = 'active', expires_at = greatest(public.enrollments.expires_at, excluded.expires_at);
  end if;
end;
$$;

-- Immediate hard delete (cascades modules, lessons, content, enrollments,
-- progress and deletion requests) — no deletion request needed.
create or replace function public.admin_delete_course(p_course_id text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.courses where id = p_course_id;
  if not found then raise exception 'Course not found.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.admin_update_module(p_module_id uuid, p_title text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if coalesce(trim(p_title), '') = '' then
    raise exception 'Every module needs a title.' using errcode = '22023';
  end if;
  update public.course_modules set title = trim(p_title) where id = p_module_id;
  if not found then raise exception 'Module not found.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.admin_delete_module(p_module_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.course_modules where id = p_module_id;
  if not found then raise exception 'Module not found.' using errcode = 'P0002'; end if;
end;
$$;

-- p_direction < 0 moves the module up (earlier), > 0 moves it down.
create or replace function public.admin_move_module(p_module_id uuid, p_direction integer)
returns void
language plpgsql security definer set search_path = '' as $$
declare v_mod public.course_modules; v_other public.course_modules;
begin
  perform private.require_admin();
  select * into v_mod from public.course_modules m where m.id = p_module_id;
  if not found then raise exception 'Module not found.' using errcode = 'P0002'; end if;

  select * into v_other from public.course_modules m
   where m.course_id = v_mod.course_id
     and ((p_direction < 0 and m.position < v_mod.position) or (p_direction > 0 and m.position > v_mod.position))
   order by case when p_direction < 0 then -m.position else m.position end
   limit 1;
  if not found then return; end if;

  -- unique (course_id, position): park one row at -1 while swapping
  update public.course_modules set position = -1 where id = v_mod.id;
  update public.course_modules set position = v_mod.position where id = v_other.id;
  update public.course_modules set position = v_other.position where id = v_mod.id;
end;
$$;

create or replace function public.admin_update_lesson(
  p_course_id text, p_lesson_key text, p_title text, p_content text,
  p_duration_minutes integer, p_is_preview boolean
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_lesson_id uuid;
begin
  perform private.require_admin();
  select l.id into v_lesson_id from public.course_lessons l
   where l.course_id = p_course_id and l.lesson_key = p_lesson_key;
  if v_lesson_id is null then raise exception 'Lesson not found.' using errcode = 'P0002'; end if;

  perform private.validate_lesson(jsonb_build_object('title', p_title, 'content', p_content));

  update public.course_lessons
     set title = trim(p_title),
         duration_minutes = greatest(1, coalesce(p_duration_minutes, 10)),
         is_preview = coalesce(p_is_preview, false)
   where id = v_lesson_id;

  insert into public.course_lesson_content (lesson_id, course_id, content)
  values (v_lesson_id, p_course_id, trim(p_content))
  on conflict (lesson_id) do update set content = excluded.content;
end;
$$;

create or replace function public.admin_delete_lesson(p_course_id text, p_lesson_key text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.course_lessons l where l.course_id = p_course_id and l.lesson_key = p_lesson_key;
  if not found then raise exception 'Lesson not found.' using errcode = 'P0002'; end if;
end;
$$;

-- Moves a lesson up/down within its module (lesson_key is unchanged, so
-- learners' progress keeps pointing at the right lesson).
create or replace function public.admin_move_lesson(p_course_id text, p_lesson_key text, p_direction integer)
returns void
language plpgsql security definer set search_path = '' as $$
declare v_lesson public.course_lessons; v_other public.course_lessons;
begin
  perform private.require_admin();
  select * into v_lesson from public.course_lessons l
   where l.course_id = p_course_id and l.lesson_key = p_lesson_key;
  if not found then raise exception 'Lesson not found.' using errcode = 'P0002'; end if;

  select * into v_other from public.course_lessons l
   where l.module_id = v_lesson.module_id
     and ((p_direction < 0 and l.position < v_lesson.position) or (p_direction > 0 and l.position > v_lesson.position))
   order by case when p_direction < 0 then -l.position else l.position end
   limit 1;
  if not found then return; end if;

  update public.course_lessons set position = -1 where id = v_lesson.id;
  update public.course_lessons set position = v_lesson.position where id = v_other.id;
  update public.course_lessons set position = v_other.position where id = v_lesson.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Users and roles
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_users()
returns table (
  id uuid, name text, email text, created_at timestamptz, last_sign_in_at timestamptz,
  email_confirmed boolean, is_instructor boolean, is_admin boolean, is_banned boolean,
  enrollment_count bigint, course_count bigint
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform private.require_admin();
  return query
  select p.id, p.name, u.email::text, u.created_at, u.last_sign_in_at,
         u.email_confirmed_at is not null, p.is_instructor, p.is_admin, p.banned_at is not null,
         (select count(*) from public.enrollments e where e.user_id = p.id),
         (select count(*) from public.courses c where c.owner_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
   order by u.created_at desc;
end;
$$;

-- Renames a user and sets their roles. Renaming also updates the instructor
-- label on their courses (where it still showed their old name).
create or replace function public.admin_update_user(
  p_user_id uuid, p_name text, p_is_instructor boolean, p_is_admin boolean
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_target public.profiles;
begin
  perform private.require_admin();
  select * into v_target from public.profiles p where p.id = p_user_id;
  if not found then raise exception 'User not found.' using errcode = 'P0002'; end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Name is required.' using errcode = '22023';
  end if;
  if p_user_id = auth.uid() and not coalesce(p_is_admin, false) then
    raise exception 'You can''t remove your own admin role.' using errcode = '22023';
  end if;
  if coalesce(p_is_admin, false) and v_target.banned_at is not null then
    raise exception 'Unban this user before making them an admin.' using errcode = '22023';
  end if;

  update public.profiles
     set name = trim(p_name),
         is_instructor = coalesce(p_is_instructor, false),
         is_admin = coalesce(p_is_admin, false)
   where id = p_user_id;

  update public.courses c set instructor = trim(p_name)
   where c.owner_id = p_user_id and c.instructor = v_target.name;
end;
$$;

-- Ban = can't sign in or refresh a session (Supabase Auth banned_until) and
-- loses admin powers at once; data is kept. Unban reverses it. An already
-- issued access token stays valid until it expires (default 1 hour).
create or replace function public.admin_set_user_banned(p_user_id uuid, p_banned boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare v_target public.profiles;
begin
  perform private.require_admin();
  if p_user_id = auth.uid() then
    raise exception 'You can''t ban yourself.' using errcode = '22023';
  end if;
  select * into v_target from public.profiles p where p.id = p_user_id;
  if not found then raise exception 'User not found.' using errcode = 'P0002'; end if;
  if v_target.is_admin and p_banned then
    raise exception 'Remove this user''s admin role before banning them.' using errcode = '22023';
  end if;

  update public.profiles set banned_at = case when p_banned then now() else null end where id = p_user_id;
  update auth.users set banned_until = case when p_banned then now() + interval '100 years' else null end
   where id = p_user_id;
end;
$$;

-- Permanent delete: removes the Supabase Auth account, which cascades to the
-- profile, enrollments, progress and deletion requests. Courses they owned
-- are kept (owner_id becomes null) — reassign or delete them separately.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare v_target public.profiles;
begin
  perform private.require_admin();
  if p_user_id = auth.uid() then
    raise exception 'You can''t delete your own account.' using errcode = '22023';
  end if;
  select * into v_target from public.profiles p where p.id = p_user_id;
  if not found then raise exception 'User not found.' using errcode = 'P0002'; end if;
  if v_target.is_admin then
    raise exception 'Remove this user''s admin role before deleting them.' using errcode = '22023';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Enrollments and progress
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_enrollments()
returns table (
  user_id uuid, user_name text, user_email text, course_id text, course_title text,
  status text, purchased_at timestamptz, expires_at timestamptz, progress_percent integer,
  completed_lessons bigint
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform private.require_admin();
  return query
  select e.user_id, p.name, u.email::text, e.course_id, c.title,
         e.status, e.purchased_at, e.expires_at, e.progress_percent,
         (select count(*) from public.lesson_progress lp where lp.user_id = e.user_id and lp.course_id = e.course_id)
    from public.enrollments e
    join public.profiles p on p.id = e.user_id
    join auth.users u on u.id = e.user_id
    join public.courses c on c.id = e.course_id
   order by e.purchased_at desc;
end;
$$;

-- Free access for p_days from now (a renewal keeps the learner's progress).
create or replace function public.admin_grant_enrollment(p_user_id uuid, p_course_id text, p_days integer default 365)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'User not found.' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception 'Course not found.' using errcode = 'P0002';
  end if;
  if p_days is null or p_days < 1 then
    raise exception 'Access must last at least one day.' using errcode = '22023';
  end if;

  insert into public.enrollments (user_id, course_id, status, purchased_at, expires_at)
  values (p_user_id, p_course_id, 'active', now(), now() + make_interval(days => p_days))
  on conflict (user_id, course_id) do update
    set status = 'active', purchased_at = excluded.purchased_at, expires_at = excluded.expires_at;
  perform private.recalc_course_progress(p_course_id);
end;
$$;

-- Ends access now but keeps the enrollment row and progress (re-grant restores it).
create or replace function public.admin_revoke_enrollment(p_user_id uuid, p_course_id text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  update public.enrollments
     set status = 'expired', expires_at = least(expires_at, now())
   where user_id = p_user_id and course_id = p_course_id;
  if not found then raise exception 'Enrollment not found.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.admin_set_enrollment_expiry(p_user_id uuid, p_course_id text, p_expires_at timestamptz)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_expires_at is null then raise exception 'Pick an expiry date.' using errcode = '22023'; end if;
  update public.enrollments
     set expires_at = p_expires_at,
         status = case when p_expires_at > now() then 'active' else 'expired' end
   where user_id = p_user_id and course_id = p_course_id;
  if not found then raise exception 'Enrollment not found.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.admin_reset_progress(p_user_id uuid, p_course_id text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.lesson_progress where user_id = p_user_id and course_id = p_course_id;
  update public.enrollments set progress_percent = 0 where user_id = p_user_id and course_id = p_course_id;
end;
$$;

-- Removes the enrollment and its progress entirely.
create or replace function public.admin_delete_enrollment(p_user_id uuid, p_course_id text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  delete from public.lesson_progress where user_id = p_user_id and course_id = p_course_id;
  delete from public.enrollments where user_id = p_user_id and course_id = p_course_id;
  if not found then raise exception 'Enrollment not found.' using errcode = 'P0002'; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Function privileges
-- ---------------------------------------------------------------------------

-- New private helpers are only called from inside security definer functions.
revoke execute on function
  private.require_admin(), private.recalc_course_progress(text),
  private.after_lessons_inserted(), private.after_lessons_deleted()
from public, anon, authenticated;

-- Every public admin_* RPC (including phase 5's): signed-in users only; each
-- one checks require_admin() itself.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
