-- Correcciones puntuales de duplicados reportados el 2026-06-25.
-- La version ejecutable desde el proyecto es `npm run fix-db`.

begin;

do $$
declare
  sugastti_source_id uuid;
  gimenez_target_id uuid;
  sugastti_result_id uuid;
  rios_target_id uuid;
  rios_result record;
  samira_target_id uuid;
  samira_source record;
  samira_result record;
begin
  -- 1. Sugastti/Lucca: fecha-5 sub-8 debe pasar a sub-6 y al jugador de fecha-9 sub-6.
  select p.id
    into sugastti_source_id
  from public.players p
  where p.normalized_name like '%sugastti%'
    and p.normalized_name like '%lucca%'
    and not (p.normalized_name like '%gimenez%' and p.normalized_name like '%fabrizio%')
  limit 1;

  select p.id
    into gimenez_target_id
  from public.players p
  where p.normalized_name like '%gimenez%'
    and p.normalized_name like '%lucca%'
    and p.normalized_name like '%fabrizio%'
  limit 1;

  if sugastti_source_id is not null and gimenez_target_id is not null then
    select ir.id
      into sugastti_result_id
    from public.imported_results ir
    where ir.player_id = sugastti_source_id
      and ir.tournament_id = 'fecha-5'
      and ir.category_id = 'sub-8'
    limit 1;

    if sugastti_result_id is not null then
      update public.imported_results ir
      set category_id = 'sub-6',
          player_id = gimenez_target_id,
          player_name_snapshot = (select full_name from public.players where id = gimenez_target_id)
      where ir.id = sugastti_result_id
        and not exists (
          select 1
          from public.imported_results other
          where other.id <> ir.id
            and other.tournament_id = ir.tournament_id
            and other.category_id = 'sub-6'
            and other.branch_id = ir.branch_id
            and other.place = ir.place
        );

      update public.circuit_points
      set category_id = 'sub-6',
          player_id = gimenez_target_id
      where imported_result_id = sugastti_result_id;
    end if;

    update public.imported_results
    set player_name_snapshot = (select full_name from public.players where id = gimenez_target_id)
    where player_id = gimenez_target_id;

    delete from public.players p
    where p.id = sugastti_source_id
      and not exists (select 1 from public.imported_results ir where ir.player_id = p.id);
  end if;

  -- 2. Rios/Castro: debe quedar solo en sub-10. El sub-8 se elimina porque el puesto
  -- equivalente en sub-10 ya esta ocupado.
  select p.id
    into rios_target_id
  from public.players p
  where p.normalized_name = 'rios castro joaquin samuel'
  limit 1;

  if rios_target_id is not null then
    for rios_result in
      select id
      from public.imported_results
      where player_id = rios_target_id
        and category_id = 'sub-8'
    loop
      delete from public.circuit_points where imported_result_id = rios_result.id;
      delete from public.imported_results where id = rios_result.id;
    end loop;

    update public.imported_results
    set player_name_snapshot = (select full_name from public.players where id = rios_target_id)
    where player_id = rios_target_id;
  end if;

  -- 3. Samira/Susana Samudio: unificar los registros de jugador. No se fuerza cambio de
  -- categoria para los resultados sub-8 porque los destinos sub-10 ya tienen esos puestos.
  select p.id
    into samira_target_id
  from public.players p
  where p.normalized_name = 'samudio santacruz samira susana'
  limit 1;

  if samira_target_id is not null then
    for samira_source in
      select p.id, p.full_name
      from public.players p
      where p.id <> samira_target_id
        and p.normalized_name like '%samudio%'
        and p.normalized_name like '%susana%'
        and (p.normalized_name like '%samira%' or p.normalized_name like '%amira%')
    loop
      for samira_result in
        select id
        from public.imported_results
        where player_id = samira_source.id
      loop
        update public.imported_results
        set player_id = samira_target_id,
            player_name_snapshot = (select full_name from public.players where id = samira_target_id)
        where id = samira_result.id;

        update public.circuit_points
        set player_id = samira_target_id
        where imported_result_id = samira_result.id;
      end loop;

      delete from public.players p
      where p.id = samira_source.id
        and not exists (select 1 from public.imported_results ir where ir.player_id = p.id);
    end loop;

    update public.imported_results
    set player_name_snapshot = (select full_name from public.players where id = samira_target_id)
    where player_id = samira_target_id;
  end if;

  insert into public.audit_logs (action, entity_type, actor_email, summary, metadata)
  values (
    'db.duplicates_fixed',
    'database',
    'admin',
    'Duplicados corregidos: Sugastti/Lucca, Rios/Castro y Samira/Susana Samudio.',
    jsonb_build_object(
      'cases',
      jsonb_build_array('sugastti_lucca', 'rios_castro', 'samira_samudio'),
      'appliedAt',
      now()
    )
  );
end $$;

commit;
