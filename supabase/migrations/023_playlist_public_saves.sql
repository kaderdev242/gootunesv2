-- Playlists publiques + sauvegardes fans

alter table public.playlists
  add column if not exists is_public boolean not null default false;

comment on column public.playlists.is_public is
  'Visible dans Discover et partageable sans être owner.';

create index if not exists playlists_public_updated_idx
  on public.playlists (updated_at desc)
  where is_public = true;

-- Sauvegardes (miroir artist_follows)
create table if not exists public.playlist_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, playlist_id)
);

create index if not exists playlist_saves_user_id_idx
  on public.playlist_saves (user_id);

create index if not exists playlist_saves_playlist_id_idx
  on public.playlist_saves (playlist_id);

alter table public.playlist_saves enable row level security;

-- Lecture : owner OU publique (anon + authenticated)
drop policy if exists "playlists_select_own" on public.playlists;
drop policy if exists "playlists_select_own_or_public" on public.playlists;
create policy "playlists_select_own_or_public"
  on public.playlists for select
  to anon, authenticated
  using (auth.uid() = user_id or is_public = true);

-- Tracks : même règle via join
drop policy if exists "playlist_tracks_select_own" on public.playlist_tracks;
drop policy if exists "playlist_tracks_select_own_or_public" on public.playlist_tracks;
create policy "playlist_tracks_select_own_or_public"
  on public.playlist_tracks for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id
        and (p.user_id = auth.uid() or p.is_public = true)
    )
  );

-- Saves
drop policy if exists "playlist_saves_select_all" on public.playlist_saves;
create policy "playlist_saves_select_all"
  on public.playlist_saves for select
  to anon, authenticated
  using (true);

drop policy if exists "playlist_saves_insert_own" on public.playlist_saves;
create policy "playlist_saves_insert_own"
  on public.playlist_saves for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.playlists p
      where p.id = playlist_id
        and p.is_public = true
        and p.user_id <> auth.uid()
    )
  );

drop policy if exists "playlist_saves_delete_own" on public.playlist_saves;
create policy "playlist_saves_delete_own"
  on public.playlist_saves for delete
  to authenticated
  using (auth.uid() = user_id);
