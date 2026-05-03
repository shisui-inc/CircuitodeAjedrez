create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  name text not null,
  sort_order integer not null unique
);

create table if not exists public.branches (
  id text primary key,
  name text not null,
  sort_order integer not null unique
);

create table if not exists public.tournaments (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  round integer not null unique,
  date date not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'importada', 'cerrada')),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  official_name text not null,
  normalized_name text not null unique,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_aliases (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  alias text not null,
  normalized_alias text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  normalized_name text not null,
  school_id uuid not null references public.schools(id),
  branch_id text references public.branches(id),
  birth_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_name, school_id)
);

alter table public.players
  add column if not exists branch_id text references public.branches(id);

alter table public.players
  add column if not exists birth_year integer;

create table if not exists public.imported_results (
  id uuid primary key default gen_random_uuid(),
  tournament_id text not null references public.tournaments(id) on delete cascade,
  category_id text not null references public.categories(id),
  branch_id text not null references public.branches(id),
  place integer check (place is null or place > 0),
  player_id uuid not null references public.players(id),
  school_id uuid not null references public.schools(id),
  player_name_snapshot text not null,
  school_name_snapshot text not null,
  tournament_points numeric(6,2) not null default 0,
  tie_breaks jsonb not null default '{}'::jsonb,
  source_url text,
  raw_row jsonb not null default '{}'::jsonb,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, category_id, branch_id, place),
  unique (tournament_id, category_id, branch_id, player_id)
);

alter table public.imported_results
  add column if not exists tournament_points numeric(6,2) not null default 0,
  add column if not exists tie_breaks jsonb not null default '{}'::jsonb,
  add column if not exists source_url text,
  add column if not exists raw_row jsonb not null default '{}'::jsonb,
  add column if not exists needs_review boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'imported_results_scope_place_unique'
      and conrelid = 'public.imported_results'::regclass
  ) then
    alter table public.imported_results
      add constraint imported_results_scope_place_unique
      unique (tournament_id, category_id, branch_id, place);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'imported_results_scope_player_unique'
      and conrelid = 'public.imported_results'::regclass
  ) then
    alter table public.imported_results
      add constraint imported_results_scope_player_unique
      unique (tournament_id, category_id, branch_id, player_id);
  end if;
end $$;

create table if not exists public.point_rules (
  place smallint primary key check (place between 1 and 10),
  points smallint not null check (points >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.circuit_points (
  id uuid primary key default gen_random_uuid(),
  imported_result_id uuid not null unique references public.imported_results(id) on delete cascade,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  category_id text not null references public.categories(id),
  branch_id text not null references public.branches(id),
  player_id uuid not null references public.players(id),
  school_id uuid not null references public.schools(id),
  place integer not null check (place between 1 and 10),
  points smallint not null check (points >= 0),
  awarded_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'circuit_points_imported_result_unique'
      and conrelid = 'public.circuit_points'::regclass
  ) then
    alter table public.circuit_points
      add constraint circuit_points_imported_result_unique
      unique (imported_result_id);
  end if;
end $$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  actor_email text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_imported_results_scope
  on public.imported_results(tournament_id, category_id, branch_id);

create index if not exists idx_circuit_points_player
  on public.circuit_points(player_id, category_id, branch_id);

create index if not exists idx_circuit_points_school
  on public.circuit_points(school_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tournaments_updated_at on public.tournaments;
create trigger trg_tournaments_updated_at
before update on public.tournaments
for each row execute function public.set_updated_at();

drop trigger if exists trg_schools_updated_at on public.schools;
create trigger trg_schools_updated_at
before update on public.schools
for each row execute function public.set_updated_at();

drop trigger if exists trg_players_updated_at on public.players;
create trigger trg_players_updated_at
before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists trg_imported_results_updated_at on public.imported_results;
create trigger trg_imported_results_updated_at
before update on public.imported_results
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.branches enable row level security;
alter table public.tournaments enable row level security;
alter table public.schools enable row level security;
alter table public.school_aliases enable row level security;
alter table public.players enable row level security;
alter table public.imported_results enable row level security;
alter table public.point_rules enable row level security;
alter table public.circuit_points enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read branches" on public.branches;
drop policy if exists "public read tournaments" on public.tournaments;
drop policy if exists "public read schools" on public.schools;
drop policy if exists "public read school aliases" on public.school_aliases;
drop policy if exists "public read players" on public.players;
drop policy if exists "public read imported results" on public.imported_results;
drop policy if exists "public read point rules" on public.point_rules;
drop policy if exists "public read circuit points" on public.circuit_points;

drop policy if exists "authenticated write categories" on public.categories;
drop policy if exists "authenticated write branches" on public.branches;
drop policy if exists "authenticated write tournaments" on public.tournaments;
drop policy if exists "authenticated write schools" on public.schools;
drop policy if exists "authenticated write school aliases" on public.school_aliases;
drop policy if exists "authenticated write players" on public.players;
drop policy if exists "authenticated write imported results" on public.imported_results;
drop policy if exists "authenticated write point rules" on public.point_rules;
drop policy if exists "authenticated write circuit points" on public.circuit_points;
drop policy if exists "authenticated read audit logs" on public.audit_logs;
drop policy if exists "authenticated insert audit logs" on public.audit_logs;

create policy "public read categories" on public.categories for select using (true);
create policy "public read branches" on public.branches for select using (true);
create policy "public read tournaments" on public.tournaments for select using (true);
create policy "public read schools" on public.schools for select using (true);
create policy "public read school aliases" on public.school_aliases for select using (true);
create policy "public read players" on public.players for select using (true);
create policy "public read imported results" on public.imported_results for select using (true);
create policy "public read point rules" on public.point_rules for select using (true);
create policy "public read circuit points" on public.circuit_points for select using (true);

create policy "authenticated write categories" on public.categories for all to authenticated using (true) with check (true);
create policy "authenticated write branches" on public.branches for all to authenticated using (true) with check (true);
create policy "authenticated write tournaments" on public.tournaments for all to authenticated using (true) with check (true);
create policy "authenticated write schools" on public.schools for all to authenticated using (true) with check (true);
create policy "authenticated write school aliases" on public.school_aliases for all to authenticated using (true) with check (true);
create policy "authenticated write players" on public.players for all to authenticated using (true) with check (true);
create policy "authenticated write imported results" on public.imported_results for all to authenticated using (true) with check (true);
create policy "authenticated write point rules" on public.point_rules for all to authenticated using (true) with check (true);
create policy "authenticated write circuit points" on public.circuit_points for all to authenticated using (true) with check (true);
create policy "authenticated read audit logs" on public.audit_logs for select to authenticated using (true);
create policy "authenticated insert audit logs" on public.audit_logs for insert to authenticated with check (true);
