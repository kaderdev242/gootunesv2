-- Suspension compte → masque les releases (web + mobile via is_hidden)
-- Réactivation → ne démasque que ce que la suspension avait masqué
-- (les hides admin manuels restent intacts)

alter table public.releases
  add column if not exists hidden_by_suspension boolean not null default false;

comment on column public.releases.hidden_by_suspension is
  'True si is_hidden a été posé par suspension du compte owner/artiste. '
  'À false pour un hide admin manuel. La réactivation ne démasque que ce flag.';

create index if not exists releases_hidden_by_suspension_idx
  on public.releases (hidden_by_suspension)
  where hidden_by_suspension = true;

create or replace function public.sync_releases_on_profile_suspension()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_suspended is not distinct from old.is_suspended then
    return new;
  end if;

  if new.is_suspended then
    -- Masque uniquement les releases encore visibles
    update public.releases r
    set
      is_hidden = true,
      hidden_by_suspension = true
    where r.is_hidden = false
      and (
        r.owner_id = new.id
        or exists (
          select 1
          from public.artists a
          where a.id = r.artist_id
            and a.owner_id = new.id
        )
      );
  else
    -- Remet en ligne uniquement ce que cette suspension avait masqué
    update public.releases r
    set
      is_hidden = false,
      hidden_by_suspension = false
    where r.hidden_by_suspension = true
      and (
        r.owner_id = new.id
        or exists (
          select 1
          from public.artists a
          where a.id = r.artist_id
            and a.owner_id = new.id
        )
      );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_suspension_hide_releases on public.profiles;
create trigger profiles_suspension_hide_releases
  after update of is_suspended on public.profiles
  for each row
  execute function public.sync_releases_on_profile_suspension();

-- Backfill : comptes déjà suspendus
update public.releases r
set
  is_hidden = true,
  hidden_by_suspension = true
where r.is_hidden = false
  and (
    exists (
      select 1
      from public.profiles p
      where p.id = r.owner_id
        and p.is_suspended = true
    )
    or exists (
      select 1
      from public.artists a
      join public.profiles p on p.id = a.owner_id
      where a.id = r.artist_id
        and p.is_suspended = true
    )
  );

-- Stream : refuse les releases masquées (sauf propriétaire)
create or replace function public.get_track_audio_key(p_track_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_audio_url text;
  v_owner_id  uuid;
  v_status    text;
  v_hidden    boolean;
begin
  select t.audio_url, r.owner_id, r.status, r.is_hidden
  into   v_audio_url, v_owner_id, v_status, v_hidden
  from   public.tracks t
  join   public.releases r on r.id = t.release_id
  where  t.id = p_track_id
  limit  1;

  if v_audio_url is null then
    return null;
  end if;

  -- Propriétaire : toujours OK
  if auth.uid() = v_owner_id then
    return v_audio_url;
  end if;

  -- Public : published et non masqué
  if v_status = 'published' and coalesce(v_hidden, false) = false then
    return v_audio_url;
  end if;

  return null;
end;
$$;

grant execute on function public.get_track_audio_key(uuid) to authenticated;
revoke execute on function public.get_track_audio_key(uuid) from anon;
