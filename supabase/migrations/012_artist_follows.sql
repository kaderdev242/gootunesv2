-- Fans suivent des artistes (onboarding mobile + Discover)
create table if not exists public.artist_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, artist_id)
);

create index if not exists artist_follows_user_id_idx on public.artist_follows (user_id);
create index if not exists artist_follows_artist_id_idx on public.artist_follows (artist_id);

alter table public.artist_follows enable row level security;

create policy "artist_follows_select_all"
  on public.artist_follows for select
  to anon, authenticated
  using (true);

create policy "artist_follows_insert_own"
  on public.artist_follows for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "artist_follows_delete_own"
  on public.artist_follows for delete
  to authenticated
  using (auth.uid() = user_id);
