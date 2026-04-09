-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users table (Extending auth.users metadata usually, but here as a public profile)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  level text check (level in ('beginner', 'intermediate', 'expert')) default 'beginner',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Puzzles table
create table public.puzzles (
  id uuid default uuid_generate_v4() primary key,
  lichess_id text unique not null,
  fen text not null,
  moves text[] not null,
  rating integer,
  themes text[],
  level_target text check (level_target in ('beginner', 'intermediate', 'expert')),
  date_assigned date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Puzzle Attempts table
create table public.puzzle_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  puzzle_id uuid references public.puzzles(id) on delete cascade not null,
  solved boolean default false,
  attempts_count integer default 1,
  time_spent_seconds integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Daily Content table
create table public.daily_content (
  id uuid default uuid_generate_v4() primary key,
  date date unique default current_date,
  culture_text text,
  culture_source text,
  puzzle_beginner_id uuid references public.puzzles(id),
  puzzle_intermediate_id uuid references public.puzzles(id),
  puzzle_expert_id uuid references public.puzzles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. AI Coach Sessions table
create table public.ai_coach_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  fen text,
  question text,
  response text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS (Row Level Security) - Basic placeholder
alter table public.users enable row level security;
alter table public.puzzles enable row level security;
alter table public.puzzle_attempts enable row level security;
alter table public.daily_content enable row level security;
alter table public.ai_coach_sessions enable row level security;

-- Basic Policies (To be refined)
create policy "Users can view their own profile" on public.users for select using (auth.uid() = id);
create policy "Puzzles are readable by everyone" on public.puzzles for select using (true);
create policy "Users can track their own attempts" on public.puzzle_attempts for all using (auth.uid() = user_id);
create policy "Daily content is readable by everyone" on public.daily_content for select using (true);
create policy "Users can view their own AI sessions" on public.ai_coach_sessions for select using (auth.uid() = user_id);
