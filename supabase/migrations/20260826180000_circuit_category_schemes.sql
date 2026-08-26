alter table public.circuits
  add column if not exists category_scheme text not null default 'pares',
  add column if not exists modality text not null default 'presencial',
  add column if not exists logo_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text;

alter table public.circuits drop constraint if exists circuits_category_scheme_check;
alter table public.circuits
  add constraint circuits_category_scheme_check check (category_scheme in ('pares', 'impares'));

alter table public.circuits drop constraint if exists circuits_modality_check;
alter table public.circuits
  add constraint circuits_modality_check check (modality in ('online', 'presencial', 'hibrido'));

insert into public.categories (id, name, sort_order) values
  ('sub-6', 'Sub 6', 1),
  ('sub-8', 'Sub 8', 2),
  ('sub-10', 'Sub 10', 3),
  ('sub-12', 'Sub 12', 4),
  ('sub-14', 'Sub 14', 5),
  ('abierto', 'Abierto', 6),
  ('sub-7', 'Sub 7', 7),
  ('sub-9', 'Sub 9', 8),
  ('sub-11', 'Sub 11', 9),
  ('sub-13', 'Sub 13', 10)
on conflict (id) do update set name = excluded.name;
