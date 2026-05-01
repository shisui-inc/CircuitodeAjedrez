truncate table
  public.audit_logs,
  public.circuit_points,
  public.imported_results,
  public.players,
  public.school_aliases,
  public.schools
restart identity cascade;

update public.tournaments
set status = 'pendiente',
    source_url = null,
    updated_at = now();
