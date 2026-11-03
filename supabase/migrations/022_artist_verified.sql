-- Badge de certification artiste (admin) + index pour filtres éventuels
alter table public.artists
  add column if not exists is_verified boolean not null default false;

comment on column public.artists.is_verified is
  'Badge bleu de certification — géré uniquement par les admins.';

create index if not exists artists_is_verified_idx
  on public.artists (is_verified)
  where is_verified = true;
