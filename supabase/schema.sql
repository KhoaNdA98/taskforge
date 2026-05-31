-- ============================================================================
-- TaskForge — Supabase schema
-- Run this once in Supabase Studio → SQL Editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / guarded enum creation.
-- ============================================================================

-- Enums --------------------------------------------------------------------
do $$ begin
  create type public.task_type as enum ('maintain', 'on_demand');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('todo', 'doing', 'review', 'done');
exception when duplicate_object then null; end $$;

-- Settings: one row per user (global hourly rate + currency) ----------------
create table if not exists public.settings (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  hourly_rate numeric(12, 2) not null default 0,
  currency    text not null default 'VND',
  updated_at  timestamptz not null default now()
);

-- Clients: maintain retainer lives here -------------------------------------
create table if not exists public.clients (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name               text not null,
  monthly_retainer   numeric(12, 2) not null default 0,
  is_maintain_active boolean not null default false,
  note               text,
  created_at         timestamptz not null default now()
);

-- Tasks ---------------------------------------------------------------------
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name          text not null,
  type          public.task_type not null default 'on_demand',
  client_id     uuid references public.clients(id) on delete set null,
  status        public.task_status not null default 'todo',
  task_date     date not null default current_date,
  hours         numeric(8, 2),
  -- rate copied in at creation time so historical reports never shift
  rate_snapshot numeric(12, 2) not null default 0,
  amount        numeric(14, 2) generated always as (coalesce(hours, 0) * rate_snapshot) stored,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, task_date desc);
create index if not exists tasks_client_idx    on public.tasks (client_id);
create index if not exists clients_user_idx     on public.clients (user_id);

-- Row Level Security: every user only sees their own rows -------------------
alter table public.settings enable row level security;
alter table public.clients  enable row level security;
alter table public.tasks    enable row level security;

drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own clients" on public.clients;
create policy "own clients" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
