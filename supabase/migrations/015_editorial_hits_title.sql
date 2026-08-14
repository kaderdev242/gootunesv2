-- Titre éditorial optionnel pour Les Hits
alter table public.editorial_hits
  add column if not exists title text;
