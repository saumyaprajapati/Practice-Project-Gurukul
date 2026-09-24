-- Phase 7 — Real lesson media: one video (uploaded file or YouTube/Vimeo
-- link) plus any number of files per lesson, stored in a private Storage
-- bucket. Run in the Supabase SQL editor after phase6-admin.sql. Safe to re-run.
--
-- Access follows the lesson-text lock: enrolled learners, the course owner
-- and admins, plus everyone signed in for free-preview lessons. Owners and
-- admins can add and remove media; nobody can overwrite an uploaded file.
--
-- Storage path convention: {course_id}/{lesson_key}/{uuid}-{file-name}
-- (lesson_key never changes, even when lessons are reordered).

-- ---------------------------------------------------------------------------
-- 1. Bucket (private; 50 MB = the free plan's global per-file limit)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-media', 'lesson-media', false, 52428800,
  array[
    'video/mp4', 'video/webm',
    'application/pdf', 'text/plain', 'text/csv',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/zip', 'application/x-zip-compressed',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. Media table
-- ---------------------------------------------------------------------------

create table if not exists public.course_lesson_media (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.course_lessons(id) on delete cascade,
  course_id    text not null references public.courses(id) on delete cascade,
  kind         text not null check (kind in ('video', 'video_link', 'file')),
  storage_path text unique,
  external_url text,
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  constraint course_lesson_media_source_check check (
    (kind = 'video_link' and external_url is not null and storage_path is null)
    or (kind <> 'video_link' and storage_path is not null and external_url is null)
  )
);

create index if not exists course_lesson_media_lesson_id_idx on public.course_lesson_media (lesson_id);
create index if not exists course_lesson_media_course_id_idx on public.course_lesson_media (course_id);

-- At most one video (upload or link) per lesson.
create unique index if not exists course_lesson_media_one_video_idx
  on public.course_lesson_media (lesson_id) where kind in ('video', 'video_link');

alter table public.course_lesson_media enable row level security;
revoke all on public.course_lesson_media from anon, authenticated;
grant select on public.course_lesson_media to authenticated;  -- writes only via the RPCs below

-- ---------------------------------------------------------------------------
-- 3. Helpers
-- ---------------------------------------------------------------------------

-- The lesson-text lock, shared by lesson content and lesson media.
create or replace function private.can_read_lesson(cid text, lid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.can_view_course(cid)
     and (
       private.lesson_is_preview(lid)
       or private.has_active_enrollment(cid)
       or private.owns_course(cid)
       or private.is_admin()
     );
$$;

create or replace function private.can_manage_course_media(cid text)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.owns_course(cid) or private.is_admin();
$$;

-- Storage read check for an object path "{course_id}/{lesson_key}/...".
-- Managers can read anything under their course (e.g. to preview right after
-- uploading); everyone else only registered media of lessons they may read.
create or replace function private.can_read_media_object(p_name text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  v_course text := split_part(p_name, '/', 1);
  v_key    text := split_part(p_name, '/', 2);
  v_lesson uuid;
begin
  if private.can_manage_course_media(v_course) then return true; end if;
  select l.id into v_lesson from public.course_lessons l where l.course_id = v_course and l.lesson_key = v_key;
  if v_lesson is null then return false; end if;
  return private.can_read_lesson(v_course, v_lesson)
     and exists (select 1 from public.course_lesson_media m where m.storage_path = p_name);
end;
$$;

revoke execute on function
  private.can_read_lesson(text, uuid), private.can_manage_course_media(text), private.can_read_media_object(text)
from public, anon;
grant execute on function
  private.can_read_lesson(text, uuid), private.can_manage_course_media(text), private.can_read_media_object(text)
to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Row policies (lesson content now shares the same helper)
-- ---------------------------------------------------------------------------

drop policy if exists "course_lesson_content_select_allowed" on public.course_lesson_content;
create policy "course_lesson_content_select_allowed" on public.course_lesson_content
  for select to authenticated using (private.can_read_lesson(course_id, lesson_id));

drop policy if exists "course_lesson_media_select_allowed" on public.course_lesson_media;
create policy "course_lesson_media_select_allowed" on public.course_lesson_media
  for select to authenticated using (private.can_read_lesson(course_id, lesson_id));

-- ---------------------------------------------------------------------------
-- 5. Storage policies (bucket lesson-media only; no update = no overwrites)
-- ---------------------------------------------------------------------------

drop policy if exists "lesson_media_read" on storage.objects;
create policy "lesson_media_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'lesson-media' and private.can_read_media_object(name));

drop policy if exists "lesson_media_upload" on storage.objects;
create policy "lesson_media_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'lesson-media'
    and private.can_manage_course_media(split_part(name, '/', 1))
    and private.lesson_in_course(split_part(name, '/', 1), split_part(name, '/', 2))
  );

drop policy if exists "lesson_media_delete" on storage.objects;
create policy "lesson_media_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lesson-media' and private.can_manage_course_media(split_part(name, '/', 1)));

-- ---------------------------------------------------------------------------
-- 6. RPCs
-- ---------------------------------------------------------------------------

-- Registers media on a lesson. For uploads the file must already be in the
-- bucket under "{course_id}/{lesson_key}/"; links must be https YouTube/Vimeo.
create or replace function public.add_lesson_media(
  p_course_id text, p_lesson_key text, p_kind text,
  p_storage_path text default null, p_external_url text default null,
  p_file_name text default null, p_mime_type text default null, p_size_bytes bigint default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_lesson uuid;
  v_prefix text := p_course_id || '/' || p_lesson_key || '/';
  v_name   text := nullif(trim(coalesce(p_file_name, '')), '');
  v_pos    int;
  v_id     uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception 'Course not found.' using errcode = 'P0002';
  end if;
  if not private.can_manage_course_media(p_course_id) then
    raise exception 'You can''t change media on this course.' using errcode = '42501';
  end if;
  select l.id into v_lesson from public.course_lessons l where l.course_id = p_course_id and l.lesson_key = p_lesson_key;
  if v_lesson is null then raise exception 'Lesson not found.' using errcode = 'P0002'; end if;
  if p_kind is null or p_kind not in ('video', 'video_link', 'file') then
    raise exception 'Invalid media type.' using errcode = '22023';
  end if;

  if p_kind = 'video_link' then
    if coalesce(p_external_url, '') !~* '^https://((www|m|player)\.)?(youtube\.com|youtu\.be|vimeo\.com)/' then
      raise exception 'Only YouTube or Vimeo links (https) are supported.' using errcode = '22023';
    end if;
    v_name := coalesce(v_name, 'Video link');
  else
    if p_storage_path is null or left(p_storage_path, length(v_prefix)) <> v_prefix then
      raise exception 'Invalid file path.' using errcode = '22023';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'lesson-media' and o.name = p_storage_path) then
      raise exception 'Upload the file first.' using errcode = '22023';
    end if;
    if v_name is null then raise exception 'File name is required.' using errcode = '22023'; end if;
  end if;

  if p_kind in ('video', 'video_link') and exists (
    select 1 from public.course_lesson_media m where m.lesson_id = v_lesson and m.kind in ('video', 'video_link')
  ) then
    raise exception 'Remove the current video first.' using errcode = '23505';
  end if;

  select coalesce(max(m.position), 0) + 1 into v_pos from public.course_lesson_media m where m.lesson_id = v_lesson;

  insert into public.course_lesson_media
    (lesson_id, course_id, kind, storage_path, external_url, file_name, mime_type, size_bytes, position)
  values (
    v_lesson, p_course_id, p_kind,
    case when p_kind = 'video_link' then null else p_storage_path end,
    case when p_kind = 'video_link' then trim(p_external_url) else null end,
    v_name, p_mime_type, p_size_bytes, v_pos
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Deletes a media row and returns its storage path (null for links) so the
-- client can remove the file from the bucket.
create or replace function public.remove_lesson_media(p_media_id uuid)
returns text
language plpgsql security definer set search_path = '' as $$
declare v_media public.course_lesson_media;
begin
  if auth.uid() is null then raise exception 'Not authenticated.' using errcode = '28000'; end if;
  select * into v_media from public.course_lesson_media m where m.id = p_media_id;
  if not found then raise exception 'Media not found.' using errcode = 'P0002'; end if;
  if not private.can_manage_course_media(v_media.course_id) then
    raise exception 'You can''t change media on this course.' using errcode = '42501';
  end if;
  delete from public.course_lesson_media where id = p_media_id;
  return v_media.storage_path;
end;
$$;

-- Storage paths under a course / module / lesson — fetched before a delete so
-- the files can be removed afterwards (SQL cascades only remove the rows).
create or replace function public.lesson_media_paths(
  p_course_id text, p_module_id uuid default null, p_lesson_key text default null
) returns setof text
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.can_manage_course_media(p_course_id) then
    raise exception 'You can''t change media on this course.' using errcode = '42501';
  end if;
  return query
  select m.storage_path
    from public.course_lesson_media m
    join public.course_lessons l on l.id = m.lesson_id
   where m.course_id = p_course_id
     and m.storage_path is not null
     and (p_module_id is null or l.module_id = p_module_id)
     and (p_lesson_key is null or l.lesson_key = p_lesson_key);
end;
$$;

revoke execute on function
  public.add_lesson_media(text, text, text, text, text, text, text, bigint),
  public.remove_lesson_media(uuid),
  public.lesson_media_paths(text, uuid, text)
from public, anon;
grant execute on function
  public.add_lesson_media(text, text, text, text, text, text, text, bigint),
  public.remove_lesson_media(uuid),
  public.lesson_media_paths(text, uuid, text)
to authenticated;
