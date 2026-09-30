-- Phase 9 — Search for the Gurukul MCP server (src/app/api/mcp): find a course
-- for a technology, and find the lessons to brush up on in your own courses.
-- Run in the Supabase SQL editor after phase8-course-analytics.sql. Safe to re-run.
--
-- Both functions are SECURITY INVOKER: they run as the signed-in user, so the
-- existing RLS policies decide what comes back. Lesson text only appears for
-- courses the caller has active access to (or owns).

-- ---------------------------------------------------------------------------
-- 1. Indexes for full-text search over lesson text
-- ---------------------------------------------------------------------------

create index if not exists course_lesson_content_fts_idx
  on public.course_lesson_content using gin (to_tsvector('english', content));

create index if not exists course_lessons_title_fts_idx
  on public.course_lessons using gin (to_tsvector('english', title));

-- ---------------------------------------------------------------------------
-- 2. Course search: approved courses matching a term, best match first
-- ---------------------------------------------------------------------------
-- Matches the course's title/category/instructor/description and its module
-- and lesson titles (full-text, plus a plain substring match so terms like
-- "k8s" or "useEffect" that don't stem well still hit).

create or replace function public.search_courses(p_query text, p_limit integer default 10)
returns table (
  id text, title text, description text, category text, instructor text, price integer,
  is_enrolled boolean, matched_lessons text[], rank real
)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
declare
  v_term text := lower(trim(coalesce(p_query, '')));
  v_tsq tsquery;
begin
  if v_term = '' then raise exception 'Search text is required.' using errcode = '22023'; end if;
  v_tsq := websearch_to_tsquery('english', v_term);

  return query
  with docs as (
    select c.id, c.title, c.description, c.category, c.instructor, c.price,
           setweight(to_tsvector('english', c.title), 'A')
             || setweight(to_tsvector('english', c.category || ' ' || c.instructor || ' ' || c.description), 'B') as doc,
           lower(c.title || ' ' || c.category || ' ' || c.description) as txt
    from public.courses c
    where c.status = 'approved'
  ),
  lessons as (
    select l.course_id, l.title,
           to_tsvector('english', m.title || ' ' || l.title) as doc,
           lower(m.title || ' ' || l.title) as txt
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
  ),
  lesson_hits as (
    select l.course_id,
           array_agg(l.title order by ts_rank(l.doc, v_tsq) desc, l.title) as titles,
           max(ts_rank(l.doc, v_tsq)) as best
    from lessons l
    where l.doc @@ v_tsq or position(v_term in l.txt) > 0
    group by l.course_id
  )
  select d.id, d.title, d.description, d.category, d.instructor, d.price,
         exists (
           select 1 from public.enrollments e   -- admins can read every row, so filter to the caller
           where e.user_id = auth.uid() and e.course_id = d.id and e.status = 'active' and e.expires_at > now()
         ),
         coalesce(h.titles[1:5], '{}'::text[]),
         (ts_rank(d.doc, v_tsq)
           + case when position(v_term in lower(d.title)) > 0 then 1 else 0 end
           + coalesce(h.best, 0) * 0.5)::real as rank
  from docs d
  left join lesson_hits h on h.course_id = d.id
  where d.doc @@ v_tsq or position(v_term in d.txt) > 0 or h.course_id is not null
  order by rank desc, d.title
  limit least(greatest(coalesce(p_limit, 10), 1), 25);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Lesson search in the caller's own courses (for "brush up on X")
-- ---------------------------------------------------------------------------
-- Only courses the caller can currently open: active, unexpired enrollment,
-- or their own course. p_course_id narrows it to one course.

create or replace function public.search_my_lessons(p_query text, p_course_id text default null, p_limit integer default 5)
returns table (
  course_id text, course_title text, module_title text, lesson_key text, lesson_title text,
  snippet text, content text, completed boolean, rank real
)
language plpgsql stable security invoker set search_path = '' as $$
#variable_conflict use_column
declare
  v_term text := lower(trim(coalesce(p_query, '')));
  v_tsq tsquery;
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if v_term = '' then raise exception 'Search text is required.' using errcode = '22023'; end if;
  v_tsq := websearch_to_tsquery('english', v_term);

  return query
  select l.course_id, c.title, m.title, l.lesson_key, l.title,
         ts_headline('english', lc.content, v_tsq, 'MaxFragments=2, MinWords=8, MaxWords=30, StartSel=**, StopSel=**'),
         left(lc.content, 4000),
         exists (
           select 1 from public.lesson_progress p   -- admins can read every row, so filter to the caller
           where p.user_id = auth.uid() and p.course_id = l.course_id and p.lesson_id = l.lesson_key
         ),
         (ts_rank(setweight(to_tsvector('english', l.title), 'A') || to_tsvector('english', lc.content), v_tsq)
           + case when position(v_term in lower(l.title)) > 0 then 1 else 0 end)::real as rank
  from public.course_lesson_content lc
  join public.course_lessons l on l.id = lc.lesson_id
  join public.course_modules m on m.id = l.module_id
  join public.courses c on c.id = l.course_id
  where (p_course_id is null or l.course_id = p_course_id)
    and (private.has_active_enrollment(l.course_id) or private.owns_course(l.course_id))
    and (to_tsvector('english', lc.content) @@ v_tsq
         or to_tsvector('english', l.title) @@ v_tsq
         or position(v_term in lower(l.title)) > 0
         or position(v_term in lower(lc.content)) > 0)
  order by rank desc, c.title, m.title, l.title
  limit least(greatest(coalesce(p_limit, 5), 1), 10);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Function privileges (same pattern as phase 6/8)
-- ---------------------------------------------------------------------------

revoke execute on function
  public.search_courses(text, integer), public.search_my_lessons(text, text, integer)
from public, anon;
grant execute on function
  public.search_courses(text, integer), public.search_my_lessons(text, text, integer)
to authenticated;
