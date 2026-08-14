-- Playlists fans (titre, description, cover + morceaux)

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now(),
  unique (playlist_id, track_id)
);

create index if not exists playlists_user_updated_idx
  on public.playlists (user_id, updated_at desc);

create index if not exists playlist_tracks_playlist_idx
  on public.playlist_tracks (playlist_id, position);

alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;

drop policy if exists "playlists_select_own" on public.playlists;
create policy "playlists_select_own"
  on public.playlists for select
  using (auth.uid() = user_id);

drop policy if exists "playlists_insert_own" on public.playlists;
create policy "playlists_insert_own"
  on public.playlists for insert
  with check (auth.uid() = user_id);

drop policy if exists "playlists_update_own" on public.playlists;
create policy "playlists_update_own"
  on public.playlists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "playlists_delete_own" on public.playlists;
create policy "playlists_delete_own"
  on public.playlists for delete
  using (auth.uid() = user_id);

drop policy if exists "playlist_tracks_select_own" on public.playlist_tracks;
create policy "playlist_tracks_select_own"
  on public.playlist_tracks for select
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks_insert_own" on public.playlist_tracks;
create policy "playlist_tracks_insert_own"
  on public.playlist_tracks for insert
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks_update_own" on public.playlist_tracks;
create policy "playlist_tracks_update_own"
  on public.playlist_tracks for update
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "playlist_tracks_delete_own" on public.playlist_tracks;
create policy "playlist_tracks_delete_own"
  on public.playlist_tracks for delete
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );
