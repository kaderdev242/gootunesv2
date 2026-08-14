-- Identifiants publics courts (8 car.) pour URLs Discover

create or replace function public.random_public_id(n integer default 8)
returns text
language plpgsql
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  result text := '';
  i integer;
begin
  for i in 1..n loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

alter table public.artists
  add column if not exists public_id text;

alter table public.releases
  add column if not exists public_id text;

-- Backfill artistes
do $$
declare
  r record;
  candidate text;
begin
  for r in select id from public.artists where public_id is null loop
    loop
      candidate := public.random_public_id(8);
      exit when not exists (
        select 1 from public.artists a where a.public_id = candidate
      );
    end loop;
    update public.artists set public_id = candidate where id = r.id;
  end loop;
end $$;

-- Backfill releases
do $$
declare
  r record;
  candidate text;
begin
  for r in select id from public.releases where public_id is null loop
    loop
      candidate := public.random_public_id(8);
      exit when not exists (
        select 1 from public.releases x where x.public_id = candidate
      );
    end loop;
    update public.releases set public_id = candidate where id = r.id;
  end loop;
end $$;

alter table public.artists
  alter column public_id set not null;

alter table public.releases
  alter column public_id set not null;

create unique index if not exists artists_public_id_key
  on public.artists (public_id);

create unique index if not exists releases_public_id_key
  on public.releases (public_id);

create or replace function public.artists_set_public_id()
returns trigger
language plpgsql
as $$
declare
  candidate text;
begin
  if new.public_id is null or new.public_id = '' then
    loop
      candidate := public.random_public_id(8);
      exit when not exists (
        select 1 from public.artists a where a.public_id = candidate
      );
    end loop;
    new.public_id := candidate;
  end if;
  return new;
end;
$$;

create or replace function public.releases_set_public_id()
returns trigger
language plpgsql
as $$
declare
  candidate text;
begin
  if new.public_id is null or new.public_id = '' then
    loop
      candidate := public.random_public_id(8);
      exit when not exists (
        select 1 from public.releases x where x.public_id = candidate
      );
    end loop;
    new.public_id := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists artists_public_id_trg on public.artists;
create trigger artists_public_id_trg
  before insert on public.artists
  for each row
  execute function public.artists_set_public_id();

drop trigger if exists releases_public_id_trg on public.releases;
create trigger releases_public_id_trg
  before insert on public.releases
  for each row
  execute function public.releases_set_public_id();
