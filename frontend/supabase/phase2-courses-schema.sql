-- Phase 2 — Courses, Enrollment & Checkout
-- Run this in the Supabase SQL editor after phase1-auth-schema.sql.

create table if not exists courses (
  id text primary key,
  title text not null,
  description text not null,
  category text not null,
  instructor text not null,
  thumbnail text,
  price integer not null,
  created_at timestamptz not null default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  status text not null check (status in ('active', 'expired')),
  purchased_at timestamptz not null default now(),
  expires_at timestamptz not null,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  unique (user_id, course_id)
);

create index if not exists enrollments_user_id_idx on enrollments (user_id);

-- Seeded from frontend/src/lib/courses/courses.js — ids must match exactly,
-- they're used as route slugs throughout the frontend.
insert into courses (id, title, description, category, instructor, thumbnail, price) values
  ('python-foundations', 'Python Foundations', 'Start writing real Python from your first sitting.', 'Programming', 'A. Rao', null, 1499),
  ('javascript-essentials', 'JavaScript Essentials', 'The language the whole web runs on, taught properly.', 'Programming', 'N. Iyer', null, 1499),
  ('data-structures-algorithms', 'Data Structures & Algorithms', 'The reasoning behind efficient code, not just syntax.', 'Computer Science', 'S. Verma', null, 2499),
  ('web-development-bootcamp', 'Web Development Bootcamp', 'Frontend to backend, one connected curriculum.', 'Web Development', 'P. Khan', null, 3499),
  ('machine-learning-basics', 'Machine Learning Basics', 'The ideas behind the models, built from first principles.', 'Data Science', 'R. Mehta', null, 2999),
  ('system-design-primer', 'System Design Primer', 'How large systems are actually put together.', 'Computer Science', 'S. Verma', null, 2999),
  ('sql-for-everyone', 'SQL for Everyone', 'Query real data with confidence, no prior experience needed.', 'Databases', 'A. Rao', null, 999),
  ('react-in-depth', 'React in Depth', 'Beyond tutorials — the patterns real applications use.', 'Web Development', 'N. Iyer', null, 1999),
  ('linux-command-line', 'Linux Command Line', 'The terminal skills every developer eventually needs.', 'Systems', 'V. Nair', null, 999),
  ('data-visualization', 'Data Visualization', 'Turn spreadsheets into stories people understand at a glance.', 'Data Science', 'R. Mehta', null, 1499),
  ('cloud-fundamentals', 'Cloud Fundamentals', 'What actually happens when you deploy to the cloud.', 'Systems', 'V. Nair', null, 1999),
  ('git-and-github', 'Git & GitHub', 'Version control that makes sense, not just commands to memorise.', 'Tools', 'P. Khan', null, 799),
  ('api-design', 'API Design', 'Build interfaces other developers will actually enjoy using.', 'Web Development', 'N. Iyer', null, 1999),
  ('statistics-for-data-science', 'Statistics for Data Science', 'The statistical foundation every ML course assumes you already have.', 'Data Science', 'R. Mehta', null, 1999),
  ('mobile-app-development', 'Mobile App Development', 'Ship your first app to a real device.', 'Mobile', 'P. Khan', null, 2499),
  ('computer-networks', 'Computer Networks', 'How data actually travels from one machine to another.', 'Computer Science', 'S. Verma', null, 1999),
  ('docker-and-containers', 'Docker & Containers', 'Package software so it runs the same everywhere.', 'Systems', 'V. Nair', null, 1499),
  ('typescript-fundamentals', 'TypeScript Fundamentals', 'Catch bugs before they ship, not after.', 'Programming', 'N. Iyer', null, 1499),
  ('operating-systems', 'Operating Systems', 'What''s really going on beneath every program you run.', 'Computer Science', 'S. Verma', null, 2499),
  ('intro-to-cybersecurity', 'Intro to Cybersecurity', 'Think like an attacker to build better defences.', 'Security', 'A. Rao', null, 1999),
  ('algorithms-in-practice', 'Algorithms in Practice', 'The classic problems, solved and explained end to end.', 'Computer Science', 'S. Verma', null, 2499)
on conflict (id) do nothing;
