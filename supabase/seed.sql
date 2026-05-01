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
  ('fecha-1', 'Fecha 1', 1, '2026-03-14', 'importada', 'https://chess-results.com/demo-fecha-1'),
  ('fecha-2', 'Fecha 2', 2, '2026-04-11', 'importada', 'https://chess-results.com/demo-fecha-2'),
  ('fecha-3', 'Fecha 3', 3, '2026-05-09', 'pendiente', null)
on conflict (id) do update set
  name = excluded.name,
  round = excluded.round,
  date = excluded.date,
  status = excluded.status,
  source_url = excluded.source_url;

insert into public.schools (id, official_name, normalized_name, city) values
  ('11111111-1111-1111-1111-111111111111', 'Colegio San Jose', 'colegio san jose', 'Ciudad del Este'),
  ('22222222-2222-2222-2222-222222222222', 'Colegio Santa Maria', 'colegio santa maria', 'Presidente Franco'),
  ('33333333-3333-3333-3333-333333333333', 'Colegio Nacional Parana', 'colegio nacional parana', 'Ciudad del Este'),
  ('44444444-4444-4444-4444-444444444444', 'Colegio del Sol', 'colegio del sol', 'Hernandarias'),
  ('55555555-5555-5555-5555-555555555555', 'Escuela Municipal de Ajedrez', 'escuela municipal de ajedrez', 'Minga Guazu')
on conflict (id) do update set
  official_name = excluded.official_name,
  normalized_name = excluded.normalized_name,
  city = excluded.city;

insert into public.school_aliases (school_id, alias, normalized_alias) values
  ('11111111-1111-1111-1111-111111111111', 'Col. San Jose', 'colegio san jose'),
  ('22222222-2222-2222-2222-222222222222', 'Sta Maria', 'santa maria'),
  ('33333333-3333-3333-3333-333333333333', 'Col. Nac. Parana', 'colegio nacional parana'),
  ('44444444-4444-4444-4444-444444444444', 'Del Sol', 'del sol'),
  ('55555555-5555-5555-5555-555555555555', 'EMA', 'ema')
on conflict (normalized_alias) do update set alias = excluded.alias, school_id = excluded.school_id;

insert into public.players (id, full_name, normalized_name, school_id, birth_year) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Mateo Silva', 'mateo silva', '11111111-1111-1111-1111-111111111111', 2015),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Diego Acosta', 'diego acosta', '33333333-3333-3333-3333-333333333333', 2014),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Lucia Benitez', 'lucia benitez', '44444444-4444-4444-4444-444444444444', 2014),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Bruno Gomez', 'bruno gomez', '11111111-1111-1111-1111-111111111111', 2013),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Emma Villalba', 'emma villalba', '22222222-2222-2222-2222-222222222222', 2012),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'Sofia Duarte', 'sofia duarte', '44444444-4444-4444-4444-444444444444', 2011),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'Santiago Rios', 'santiago rios', '11111111-1111-1111-1111-111111111111', 2008),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'Federico Almada', 'federico almada', '33333333-3333-3333-3333-333333333333', 2009)
on conflict (id) do update set
  full_name = excluded.full_name,
  normalized_name = excluded.normalized_name,
  school_id = excluded.school_id,
  birth_year = excluded.birth_year;

insert into public.imported_results (
  id, tournament_id, category_id, branch_id, place, player_id, school_id,
  player_name_snapshot, school_name_snapshot, tournament_points, tie_breaks, source_url
) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'fecha-1', 'sub-10', 'absoluto', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Mateo Silva', 'Colegio San Jose', 5, '{"Buch": 18, "SB": 14}', 'https://chess-results.com/demo-fecha-1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'fecha-1', 'sub-10', 'absoluto', 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '33333333-3333-3333-3333-333333333333', 'Diego Acosta', 'Colegio Nacional Parana', 4, '{"Buch": 17, "SB": 12}', 'https://chess-results.com/demo-fecha-1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'fecha-1', 'sub-10', 'absoluto', 3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '11111111-1111-1111-1111-111111111111', 'Bruno Gomez', 'Colegio San Jose', 4, '{"Buch": 16, "SB": 11}', 'https://chess-results.com/demo-fecha-1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'fecha-2', 'sub-10', 'absoluto', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '33333333-3333-3333-3333-333333333333', 'Diego Acosta', 'Colegio Nacional Parana', 5, '{"Buch": 19, "SB": 14}', 'https://chess-results.com/demo-fecha-2'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', 'fecha-2', 'sub-10', 'absoluto', 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Mateo Silva', 'Colegio San Jose', 4.5, '{"Buch": 18, "SB": 13}', 'https://chess-results.com/demo-fecha-2'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', 'fecha-1', 'sub-12', 'femenino', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '22222222-2222-2222-2222-222222222222', 'Emma Villalba', 'Colegio Santa Maria', 5, '{"Buch": 19, "SB": 15}', 'https://chess-results.com/demo-fecha-1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', 'fecha-2', 'sub-12', 'femenino', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '44444444-4444-4444-4444-444444444444', 'Sofia Duarte', 'Colegio del Sol', 5, '{"Buch": 19, "SB": 16}', 'https://chess-results.com/demo-fecha-2'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8', 'fecha-2', 'abierto', 'absoluto', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '11111111-1111-1111-1111-111111111111', 'Santiago Rios', 'Colegio San Jose', 5.5, '{"Buch": 22, "SB": 19}', 'https://chess-results.com/demo-fecha-2')
on conflict (id) do update set
  place = excluded.place,
  tournament_points = excluded.tournament_points,
  tie_breaks = excluded.tie_breaks,
  source_url = excluded.source_url;

insert into public.circuit_points (
  imported_result_id, tournament_id, category_id, branch_id, player_id, school_id, place, points
)
select
  ir.id,
  ir.tournament_id,
  ir.category_id,
  ir.branch_id,
  ir.player_id,
  ir.school_id,
  ir.place,
  pr.points
from public.imported_results ir
join public.point_rules pr on pr.place = ir.place
where ir.place between 1 and 10
on conflict (imported_result_id) do update set
  points = excluded.points,
  place = excluded.place;

insert into public.audit_logs (action, entity_type, actor_email, summary, metadata) values
  ('seed.loaded', 'database', 'admin@circuito.local', 'Datos demo cargados.', '{"source": "supabase/seed.sql"}');
