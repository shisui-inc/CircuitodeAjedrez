begin;

create table if not exists public.circuits (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  short_name text not null,
  season text not null,
  location text not null default '',
  description text not null default '',
  status text not null default 'borrador' check (status in ('borrador', 'activo', 'finalizado')),
  is_published boolean not null default false,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.circuits (id, slug, name, short_name, season, location, description, status, is_published, starts_at, ends_at)
values (
  'circuito-paranaense-2026',
  'circuito-paranaense-2026',
  'Circuito Escolar de Ajedrez Paranaense',
  'Paranaense 2026',
  '2026',
  'Ciudad del Este, Paraguay',
  'Circuito escolar organizado por categorias y ramas, con resultados acumulados por fecha.',
  'finalizado',
  true,
  '2026-03-14',
  '2026-05-09'
)
on conflict (id) do update set
  status = 'finalizado',
  is_published = true,
  updated_at = now();

alter table public.tournaments
  add column if not exists circuit_id text not null default 'circuito-paranaense-2026' references public.circuits(id) on delete cascade;

update public.tournaments
set circuit_id = 'circuito-paranaense-2026'
where circuit_id is null;

alter table public.tournaments drop constraint if exists tournaments_round_key;
create unique index if not exists tournaments_circuit_round_key on public.tournaments(circuit_id, round);
create index if not exists tournaments_circuit_id_idx on public.tournaments(circuit_id);

alter table public.circuits enable row level security;
drop policy if exists "public read circuits" on public.circuits;
drop policy if exists "authenticated write circuits" on public.circuits;
create policy "public read circuits" on public.circuits for select using (is_published = true or auth.role() = 'authenticated');
create policy "authenticated write circuits" on public.circuits for all to authenticated using (true) with check (true);

drop trigger if exists trg_circuits_updated_at on public.circuits;
create trigger trg_circuits_updated_at before update on public.circuits for each row execute function public.set_updated_at();

commit;
