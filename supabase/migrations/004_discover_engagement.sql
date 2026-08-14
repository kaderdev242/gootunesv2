-- Agrégats publics pour Discover (sans exposer les lignes d'achat / écoute)
create or replace function public.get_release_engagement(
  since_ts timestamptz,
  purchase_weight int default 3,
  play_weight int default 1
)
returns table (release_id uuid, score bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id as release_id,
    (
      coalesce(p.cnt, 0) * purchase_weight
      + coalesce(pl.cnt, 0) * play_weight
    )::bigint as score
  from public.releases r
  left join (
    select pu.release_id, count(*)::bigint as cnt
    from public.purchases pu
    where pu.status = 'completed'
      and pu.created_at >= since_ts
    group by pu.release_id
  ) p on p.release_id = r.id
  left join (
    select tp.release_id, count(*)::bigint as cnt
    from public.track_plays tp
    where tp.created_at >= since_ts
    group by tp.release_id
  ) pl on pl.release_id = r.id
  where r.status = 'published';
$$;

grant execute on function public.get_release_engagement(timestamptz, int, int) to anon, authenticated;
