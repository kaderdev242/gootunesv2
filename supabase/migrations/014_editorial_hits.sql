-- Hits éditoriaux (section Discover « Les Hits ») — curation admin

create table if not exists public.editorial_hits (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  title text,
  cover_url text,
  position int not null default 0,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track_id)
);

create index if not exists editorial_hits_published_pos_idx
  on public.editorial_hits (is_published, position)
  where is_published = true;

create index if not exists editorial_hits_position_idx
  on public.editorial_hits (position);

alter table public.editorial_hits enable row level security;

-- Lecture publique des hits publiés (feed Discover)
drop policy if exists "editorial_hits_select_published" on public.editorial_hits;
create policy "editorial_hits_select_published"
  on public.editorial_hits for select
  using (
    is_published = true
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Écritures via service role (admin client) — pas de policy insert/update/delete pour les users
