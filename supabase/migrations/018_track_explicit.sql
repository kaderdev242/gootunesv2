-- Marquage contenu explicite (paroles à caractère sexuel, violent, etc.)
alter table public.tracks
  add column if not exists is_explicit boolean not null default false;

comment on column public.tracks.is_explicit is
  'True si le morceau contient du contenu explicite (paroles, thèmes).';
