-- Rotina + Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- As políticas abaixo isolam os dados por auth.uid().

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Minha rotina',
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '☀️',
  category text not null default 'Rotina',
  time time,
  goal_value numeric,
  goal_unit text,
  frequency text not null default 'daily' check (frequency in ('daily','specific','weekly')),
  days integer[] not null default '{}',
  weekly_target integer not null default 3 check (weekly_target between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null default '',
  color text not null default 'yellow',
  x integer not null default 40,
  y integer not null default 40,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'obsidian',
  motivation boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.notes enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles own rows" on public.profiles;
create policy "profiles own rows" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);

drop policy if exists "habits own rows" on public.habits;
create policy "habits own rows" on public.habits for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists "completions own rows" on public.habit_completions;
create policy "completions own rows" on public.habit_completions for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists "notes own rows" on public.notes;
create policy "notes own rows" on public.notes for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists "settings own rows" on public.user_settings;
create policy "settings own rows" on public.user_settings for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

grant select, insert, update, delete on public.profiles, public.habits, public.habit_completions, public.notes, public.user_settings to authenticated;