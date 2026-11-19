-- 032 — Blog Gootunes : articles éditoriaux (actualités, annonces).
--
-- Additif : une table + RLS. Lecture publique des seuls articles publiés ;
-- toutes les écritures passent par le service role (actions admin côté serveur).
-- Retour arrière :
--   drop table if exists public.blog_posts;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null check (char_length(title) between 1 and 160),
  excerpt text not null default '' check (char_length(excerpt) <= 320),
  cover_url text,
  -- Document Tiptap (JSON ProseMirror), rendu côté serveur par une liste fermée de blocs.
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  reading_minutes integer not null default 1 check (reading_minutes >= 1),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published_at desc)
  where status = 'published';

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists blog_posts_select_published on public.blog_posts;
create policy blog_posts_select_published on public.blog_posts
  for select
  using (status = 'published' and published_at is not null and published_at <= now());
