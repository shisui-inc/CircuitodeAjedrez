-- Existing Paranaense results were already public before the review workflow existed.
update public.tournaments
set status = 'cerrada'
where circuit_id = 'circuito-paranaense-2026'
  and status = 'importada';

-- Anonymous readers only receive dates that the administrator explicitly published.
drop policy if exists "public read tournaments" on public.tournaments;
create policy "public read tournaments" on public.tournaments
for select using (
  auth.role() = 'authenticated'
  or (
    status = 'cerrada'
    and exists (
      select 1 from public.circuits
      where circuits.id = tournaments.circuit_id
        and circuits.is_published = true
    )
  )
);

drop policy if exists "public read imported results" on public.imported_results;
create policy "public read imported results" on public.imported_results
for select using (
  auth.role() = 'authenticated'
  or exists (
    select 1
    from public.tournaments
    join public.circuits on circuits.id = tournaments.circuit_id
    where tournaments.id = imported_results.tournament_id
      and tournaments.status = 'cerrada'
      and circuits.is_published = true
  )
);

drop policy if exists "public read circuit points" on public.circuit_points;
create policy "public read circuit points" on public.circuit_points
for select using (
  auth.role() = 'authenticated'
  or exists (
    select 1
    from public.tournaments
    join public.circuits on circuits.id = tournaments.circuit_id
    where tournaments.id = circuit_points.tournament_id
      and tournaments.status = 'cerrada'
      and circuits.is_published = true
  )
);
