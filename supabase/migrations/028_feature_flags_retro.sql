-- Fonctionnalités activables par l'admin + « Rétro » (récap personnalisé artiste / label)

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.feature_flags enable row level security;

-- Lecture libre (simple drapeau on/off) ; écriture réservée au service role (actions admin)
drop policy if exists "feature_flags_select_all" on public.feature_flags;
create policy "feature_flags_select_all"
  on public.feature_flags for select
  using (true);

insert into public.feature_flags (key, enabled)
values ('retro', false)
on conflict (key) do nothing;

-- Index utiles au récap (fenêtres de dates par créateur)
create index if not exists track_plays_owner_created_idx
  on public.track_plays (owner_id, created_at desc);
create index if not exists purchases_seller_created_idx
  on public.purchases (seller_id, created_at desc);

-- Récap du créateur connecté sur une période [p_start, p_end[
create or replace function public.get_creator_retro(p_start timestamptz, p_end timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_span interval := p_end - p_start;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  with plays as (
    select tp.track_id, tp.listener_id, tp.country, tp.created_at, r.artist_id
    from public.track_plays tp
    join public.releases r on r.id = tp.release_id
    where tp.owner_id = v_uid
      and tp.created_at >= p_start and tp.created_at < p_end
  ),
  sales as (
    select p.amount_fcfa, p.artist_net_fcfa, p.release_id
    from public.purchases p
    where p.seller_id = v_uid and p.status = 'completed'
      and p.created_at >= p_start and p.created_at < p_end
  )
  select jsonb_build_object(
    'plays', (select count(*) from plays),
    'listeners', (select count(distinct listener_id) from plays where listener_id is not null),
    'countries_count', (select count(distinct country) from plays where country is not null),
    'plays_prev', (
      select count(*) from public.track_plays tp
      where tp.owner_id = v_uid
        and tp.created_at >= p_start - v_span and tp.created_at < p_start
    ),
    'top_tracks', coalesce((
      select jsonb_agg(t order by t.plays desc)
      from (
        select tr.title, rl.title as release_title, rl.cover_url as cover, count(*) as plays
        from plays pl
        join public.tracks tr on tr.id = pl.track_id
        join public.releases rl on rl.id = tr.release_id
        group by tr.id, tr.title, rl.title, rl.cover_url
        order by count(*) desc
        limit 5
      ) t
    ), '[]'::jsonb),
    'top_countries', coalesce((
      select jsonb_agg(c order by c.plays desc)
      from (
        select country, count(*) as plays
        from plays where country is not null
        group by country order by count(*) desc limit 3
      ) c
    ), '[]'::jsonb),
    'top_artists', coalesce((
      select jsonb_agg(a order by a.plays desc)
      from (
        select ar.stage_name as name, ar.avatar_url as avatar, count(*) as plays
        from plays pl
        join public.artists ar on ar.id = pl.artist_id
        group by ar.id, ar.stage_name, ar.avatar_url
        order by count(*) desc limit 5
      ) a
    ), '[]'::jsonb),
    'peak_dow', (
      select extract(isodow from created_at at time zone 'Africa/Lagos')::int
      from plays group by 1 order by count(*) desc limit 1
    ),
    'peak_hour', (
      select extract(hour from created_at at time zone 'Africa/Lagos')::int
      from plays group by 1 order by count(*) desc limit 1
    ),
    'best_day', (
      select jsonb_build_object('date', d, 'plays', n)
      from (
        select (created_at at time zone 'Africa/Lagos')::date as d, count(*) as n
        from plays group by 1 order by count(*) desc limit 1
      ) b
    ),
    'sales', (select count(*) from sales),
    'gross', (select coalesce(sum(amount_fcfa), 0) from sales),
    'net', (select coalesce(sum(artist_net_fcfa), 0) from sales),
    'top_release', (
      select jsonb_build_object('title', rl.title, 'cover', rl.cover_url, 'sales', s.n)
      from (select release_id, count(*) as n from sales group by release_id order by count(*) desc limit 1) s
      join public.releases rl on rl.id = s.release_id
    ),
    'total_net', (
      select coalesce(sum(artist_net_fcfa), 0) from public.purchases
      where seller_id = v_uid and status = 'completed' and created_at < p_end
    ),
    'total_plays', (
      select count(*) from public.track_plays where owner_id = v_uid and created_at < p_end
    ),
    'new_followers', (
      select count(*) from public.artist_follows f
      join public.artists ar on ar.id = f.artist_id
      where ar.owner_id = v_uid
        and f.created_at >= p_start and f.created_at < p_end
    ),
    'favorites', (
      select count(*) from public.favorites fv
      join public.releases rl on rl.id = fv.release_id
      where rl.owner_id = v_uid
        and fv.created_at >= p_start and fv.created_at < p_end
    ),
    'releases', (
      select count(*) from public.releases rl
      where rl.owner_id = v_uid
        and rl.created_at >= p_start and rl.created_at < p_end
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_creator_retro(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_creator_retro(timestamptz, timestamptz) to authenticated;
