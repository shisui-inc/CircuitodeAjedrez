insert into public.categories (id, name, sort_order) values
  ('sub-6', 'Sub 6', 1),
  ('sub-8', 'Sub 8', 2),
  ('sub-10', 'Sub 10', 3),
  ('sub-12', 'Sub 12', 4),
  ('sub-14', 'Sub 14', 5),
  ('abierto', 'Abierto', 6)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.branches (id, name, sort_order) values
  ('absoluto', 'Absoluto', 1),
  ('femenino', 'Femenino', 2)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.point_rules (place, points) values
  (1, 12), (2, 11), (3, 10), (4, 9), (5, 8),
  (6, 7), (7, 6), (8, 5), (9, 4), (10, 3)
on conflict (place) do update set points = excluded.points, updated_at = now();

insert into public.tournaments (id, name, round, date, status, source_url) values
  ('fecha-1', 'Fecha 1', 1, '2026-03-14', 'pendiente', null),
  ('fecha-2', 'Fecha 2', 2, '2026-04-11', 'pendiente', null),
  ('fecha-3', 'Fecha 3', 3, '2026-05-09', 'pendiente', null),
  ('fecha-4', 'Fecha 4', 4, '2026-06-13', 'pendiente', null),
  ('fecha-5', 'Fecha 5', 5, '2026-07-11', 'pendiente', null),
  ('fecha-6', 'Fecha 6', 6, '2026-08-08', 'pendiente', null),
  ('fecha-7', 'Fecha 7', 7, '2026-09-12', 'pendiente', null),
  ('fecha-8', 'Fecha 8', 8, '2026-10-10', 'pendiente', null),
  ('fecha-9', 'Fecha 9', 9, '2026-11-14', 'pendiente', null),
  ('fecha-10', 'Fecha 10', 10, '2026-12-12', 'pendiente', null),
  ('fecha-11', 'Fecha 11', 11, '2027-01-09', 'pendiente', null),
  ('fecha-12', 'Fecha 12', 12, '2027-02-13', 'pendiente', null)
on conflict (id) do update set
  name = excluded.name,
  round = excluded.round,
  date = excluded.date,
  status = excluded.status,
  source_url = excluded.source_url;
