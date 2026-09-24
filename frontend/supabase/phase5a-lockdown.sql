-- Phase 5a — close the Data API to the publishable key before anything else.
-- Run this in the Supabase SQL editor after phase1-4.
-- Safe while the old custom-auth app is still running (it uses the secret key,
-- which bypasses RLS and is unaffected by these revokes).

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on table public.%I from anon, authenticated', t.tablename);
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Tables/functions created from now on are NOT automatically exposed.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;
