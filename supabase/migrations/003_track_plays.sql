-- Lectures / écoutes pour les statistiques créateur
create table if not exists public.track_plays (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  listener_id uuid references public.profiles (id) on delete set null,
  country text,
  created_at timestamptz not null default now()
);

create index if not exists track_plays_owner_id_idx on public.track_plays (owner_id);
create index if not exists track_plays_track_id_idx on public.track_plays (track_id);
create index if not exists track_plays_release_id_idx on public.track_plays (release_id);
create index if not exists track_plays_created_at_idx on public.track_plays (created_at desc);

alter table public.track_plays enable row level security;

create policy "track_plays_insert_authenticated"
  on public.track_plays for insert
  to authenticated
  with check (true);

create policy "track_plays_select_owner"
  on public.track_plays for select
  to authenticated
  using (owner_id = auth.uid());
