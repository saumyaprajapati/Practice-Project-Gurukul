-- Phase 8 — Course analytics for instructors: enrollments over time,
-- completion, lesson drop-off, who's watching now, and the learner list.
-- Run in the Supabase SQL editor after phase7-lesson-media.sql. Safe to re-run.
--
-- Instructors can't read their learners' enrollments/progress rows directly
-- (RLS: own rows only), so everything goes through security-definer RPCs that
-- check the caller owns the course (or is an admin). create_course() enrolls
-- the owner in their own course, so the owner is left out of every number.

-- ---------------------------------------------------------------------------
-- 1. Lesson activity (one row per learner per course: where they are, and
--    when they were last on a lesson page)
-- ---------------------------------------------------------------------------

create table if not exists public.lesson_activity (
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  course_id    text not null references public.courses(id) on delete cascade,
  lesson_key   text not null,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index if not exists lesson_activity_course_seen_idx on public.lesson_activity (course_id, last_seen_at);

alter table public.lesson_activity enable row level security;
revoke all on public.lesson_activity from anon, authenticated;  -- reads/writes only via the RPCs below

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

create or replace function private.require_course_owner(cid text)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not exists (select 1 from public.courses c where c.id = cid) then
    raise exception 'Course not found.' using errcode = 'P0002';
  end if;
  if not (private.owns_course(cid) or private.is_admin()) then
    raise exception 'You can only view analytics for your own courses.' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Heartbeat (sent every minute while a lesson page is open and visible)
-- ---------------------------------------------------------------------------

create or replace function public.touch_lesson_activity(p_course_id text, p_lesson_key text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not private.has_active_enrollment(p_course_id) then
    raise exception 'No active enrollment for this course.' using errcode = '42501';
  end if;
  if not private.lesson_in_course(p_course_id, p_lesson_key) then
    raise exception 'Lesson not found.' using errcode = 'P0002';
  end if;

  insert into public.lesson_activity (user_id, course_id, lesson_key, last_seen_at)
  values (auth.uid(), p_course_id, p_lesson_key, now())
  on conflict (user_id, course_id) do update
    set lesson_key = excluded.lesson_key, last_seen_at = excluded.last_seen_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Overview
-- ---------------------------------------------------------------------------
-- "Watching now" = on a lesson page in the last 2 minutes. Months are UTC.
-- lessonFunnel / moduleCompletion return counts; the page turns them into %
-- of totals.enrolled. stopPoints = each unfinished learner's furthest
-- completed lesson (in course order), counted per lesson.

create or replace function public.course_analytics(p_course_id text)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_course jsonb;
begin
  perform private.require_course_owner(p_course_id);
  select c.owner_id, jsonb_build_object('id', c.id, 'title', c.title, 'status', c.status)
    into v_owner, v_course
    from public.courses c where c.id = p_course_id;

  return (
    with learners as (
      select e.user_id, e.status, e.purchased_at, e.expires_at, e.progress_percent
        from public.enrollments e
       where e.course_id = p_course_id and e.user_id is distinct from v_owner
    ),
    lessons as (
      select l.lesson_key, l.title as lesson_title, l.module_id, m.title as module_title,
             row_number() over (order by m.position, l.position) as ord
        from public.course_lessons l
        join public.course_modules m on m.id = l.module_id
       where l.course_id = p_course_id
    ),
    done as (
      select lp.user_id, lp.lesson_id as lesson_key, lp.completed_at
        from public.lesson_progress lp
        join learners le on le.user_id = lp.user_id
       where lp.course_id = p_course_id
    ),
    activity as (
      select a.user_id, a.last_seen_at
        from public.lesson_activity a
        join learners le on le.user_id = a.user_id
       where a.course_id = p_course_id
    ),
    furthest as (
      select distinct on (d.user_id) d.user_id, ls.lesson_key
        from done d
        join lessons ls on ls.lesson_key = d.lesson_key
        join learners le on le.user_id = d.user_id and le.progress_percent < 100
       order by d.user_id, ls.ord desc
    )
    select jsonb_build_object(
      'course', v_course,
      'totals', jsonb_build_object(
        'enrolled',     (select count(*) from learners),
        'active',       (select count(*) from learners where status = 'active' and expires_at > now()),
        'completed',    (select count(*) from learners where progress_percent = 100),
        'notStarted',   (select count(*) from learners where progress_percent = 0),
        'avgProgress',  (select coalesce(round(avg(progress_percent))::int, 0) from learners),
        'watchingNow',  (select count(*) from activity where last_seen_at > now() - interval '2 minutes'),
        'activeLast7Days', (
          select count(*) from (
            select user_id from activity where last_seen_at > now() - interval '7 days'
            union
            select user_id from done where completed_at > now() - interval '7 days'
          ) recent
        ),
        'totalLessons', (select count(*) from lessons)
      ),
      'enrollmentsByMonth', (
        select jsonb_agg(jsonb_build_object(
                 'month', to_char(m.month, 'YYYY-MM'),
                 'count', (select count(*) from learners le
                            where date_trunc('month', le.purchased_at at time zone 'UTC') = m.month)
               ) order by m.month)
          from generate_series(
                 date_trunc('month', now() at time zone 'UTC') - interval '11 months',
                 date_trunc('month', now() at time zone 'UTC'),
                 interval '1 month'
               ) as m(month)
      ),
      'progressBuckets', jsonb_build_array(
        jsonb_build_object('label', '0%',     'count', (select count(*) from learners where progress_percent = 0)),
        jsonb_build_object('label', '1–25%',  'count', (select count(*) from learners where progress_percent between 1 and 25)),
        jsonb_build_object('label', '26–50%', 'count', (select count(*) from learners where progress_percent between 26 and 50)),
        jsonb_build_object('label', '51–75%', 'count', (select count(*) from learners where progress_percent between 51 and 75)),
        jsonb_build_object('label', '76–99%', 'count', (select count(*) from learners where progress_percent between 76 and 99)),
        jsonb_build_object('label', '100%',   'count', (select count(*) from learners where progress_percent = 100))
      ),
      'lessonFunnel', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'lessonKey', ls.lesson_key,
                 'lessonTitle', ls.lesson_title,
                 'moduleId', ls.module_id,
                 'moduleTitle', ls.module_title,
                 'completedCount', (select count(*) from done d where d.lesson_key = ls.lesson_key)
               ) order by ls.ord), '[]'::jsonb)
          from lessons ls
      ),
      'stopPoints', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'lessonKey', s.lesson_key,
                 'lessonTitle', s.lesson_title,
                 'moduleTitle', s.module_title,
                 'count', s.learner_count
               ) order by s.learner_count desc, s.ord), '[]'::jsonb)
          from (
            select ls.lesson_key, ls.lesson_title, ls.module_title, ls.ord, count(*) as learner_count
              from furthest f
              join lessons ls on ls.lesson_key = f.lesson_key
             group by ls.lesson_key, ls.lesson_title, ls.module_title, ls.ord
          ) s
      ),
      'moduleCompletion', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'moduleTitle', m.title,
                 'lessonCount', (select count(*) from lessons ls where ls.module_id = m.id),
                 'completedCount', (
                   select count(*) from (
                     select d.user_id
                       from done d
                       join lessons ls on ls.lesson_key = d.lesson_key
                      where ls.module_id = m.id
                      group by d.user_id
                     having count(*) = (select count(*) from lessons ls2 where ls2.module_id = m.id)
                   ) finished
                 )
               ) order by m.position), '[]'::jsonb)
          from public.course_modules m
         where m.course_id = p_course_id
      )
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Learner list (name only — learner emails stay private)
-- ---------------------------------------------------------------------------
-- current_lesson_title: the lesson they last had open, else the furthest one
-- they completed. last_active_at: latest of lesson-page visit and completion.

create or replace function public.course_students(p_course_id text)
returns table (
  user_id uuid, name text, enrolled_at timestamptz, status text, expires_at timestamptz,
  progress_percent integer, completed_lessons bigint, current_lesson_title text, last_active_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform private.require_course_owner(p_course_id);
  return query
  select e.user_id, p.name, e.purchased_at,
         case when e.status = 'active' and e.expires_at > now() then 'active' else 'expired' end,
         e.expires_at, e.progress_percent,
         (select count(*) from public.lesson_progress lp where lp.user_id = e.user_id and lp.course_id = e.course_id),
         coalesce(
           (select l.title from public.course_lessons l where l.course_id = e.course_id and l.lesson_key = a.lesson_key),
           (select l.title
              from public.lesson_progress lp
              join public.course_lessons l on l.course_id = lp.course_id and l.lesson_key = lp.lesson_id
              join public.course_modules m on m.id = l.module_id
             where lp.user_id = e.user_id and lp.course_id = e.course_id
             order by m.position desc, l.position desc
             limit 1)
         ),
         greatest(
           a.last_seen_at,
           (select max(lp.completed_at) from public.lesson_progress lp where lp.user_id = e.user_id and lp.course_id = e.course_id)
         )
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    join public.profiles p on p.id = e.user_id
    left join public.lesson_activity a on a.user_id = e.user_id and a.course_id = e.course_id
   where e.course_id = p_course_id and e.user_id is distinct from c.owner_id
   order by e.purchased_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Function privileges
-- ---------------------------------------------------------------------------

revoke execute on function private.require_course_owner(text) from public, anon, authenticated;

revoke execute on function
  public.touch_lesson_activity(text, text), public.course_analytics(text), public.course_students(text)
from public, anon;
grant execute on function
  public.touch_lesson_activity(text, text), public.course_analytics(text), public.course_students(text)
to authenticated;
