-- Indexes Discover : filtres status/is_hidden + tri created_at
create index if not exists idx_releases_published_feed
  on public.releases (created_at desc)
  where status = 'published' and coalesce(is_hidden, false) = false;

create index if not exists idx_releases_published_type
  on public.releases (type, created_at desc)
  where status = 'published' and coalesce(is_hidden, false) = false;

create index if not exists idx_releases_is_hidden
  on public.releases (is_hidden)
  where is_hidden = true;
