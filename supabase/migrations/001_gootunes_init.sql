-- Gootunes initial schema (Auth + marketplace Direct-to-Fan)

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('fan', 'artist', 'label');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.label_plan as enum ('none', 'starter', 'unlimited');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.release_type as enum ('single', 'album');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.release_status as enum ('draft', 'published');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'completed', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum ('mtn', 'orange', 'wave', 'airtel', 'mpesa');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'fan',
  country text,
  phone text,
  bio text,
  genres text[] not null default '{}',
  onboarding_completed boolean not null default false,
  label_plan public.label_plan not null default 'none',
  label_plan_expires_at timestamptz,
  balance_fcfa numeric(14,2) not null default 0 check (balance_fcfa >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  label_id uuid references public.profiles (id) on delete set null,
  stage_name text not null,
  bio text,
  avatar_url text,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type public.release_type not null,
  title text not null,
  cover_url text,
  price_fcfa numeric(14,2) not null default 0 check (price_fcfa >= 0),
  genre text,
  status public.release_status not null default 'draft',
  credits jsonb not null default '{}'::jsonb,
  featuring text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  title text not null,
  audio_url text,
  track_number int not null default 1,
  duration_seconds int,
  price_fcfa numeric(14,2),
  credits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  track_id uuid references public.tracks (id) on delete set null,
  amount_fcfa numeric(14,2) not null check (amount_fcfa >= 0),
  commission_fcfa numeric(14,2) not null check (commission_fcfa >= 0),
  artist_net_fcfa numeric(14,2) not null check (artist_net_fcfa >= 0),
  payment_method public.payment_method not null,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount_fcfa numeric(14,2) not null check (amount_fcfa > 0),
  payment_method public.payment_method not null,
  phone text not null,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, release_id)
);

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  purchase_id uuid references public.purchases (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, release_id)
);

create index if not exists idx_artists_owner on public.artists (owner_id);
create index if not exists idx_artists_label on public.artists (label_id);
create index if not exists idx_releases_owner on public.releases (owner_id);
create index if not exists idx_releases_status on public.releases (status);
create index if not exists idx_tracks_release on public.tracks (release_id);
create index if not exists idx_purchases_seller on public.purchases (seller_id);
create index if not exists idx_purchases_buyer on public.purchases (buyer_id);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists releases_updated_at on public.releases;
create trigger releases_updated_at
  before update on public.releases
  for each row execute function public.set_updated_at();

-- Create minimal profile on signup (créateurs complètent via onboarding)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'fan');
begin
  insert into public.profiles (id, email, role, onboarding_completed)
  values (
    new.id,
    new.email,
    v_role,
    case when v_role = 'fan' then true else false end
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Credit seller balance when purchase completes
create or replace function public.handle_purchase_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    update public.profiles
      set balance_fcfa = balance_fcfa + new.artist_net_fcfa
      where id = new.seller_id;

    insert into public.library_items (user_id, release_id, purchase_id)
    values (new.buyer_id, new.release_id, new.id)
    on conflict (user_id, release_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_purchase_completed on public.purchases;
create trigger on_purchase_completed
  after insert or update of status on public.purchases
  for each row execute function public.handle_purchase_completed();

-- Debit balance when withdrawal completes
create or replace function public.handle_withdrawal_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    update public.profiles
      set balance_fcfa = balance_fcfa - new.amount_fcfa
      where id = new.profile_id
        and balance_fcfa >= new.amount_fcfa;
    if not found then
      raise exception 'Solde insuffisant';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_withdrawal_completed on public.withdrawals;
create trigger on_withdrawal_completed
  after insert or update of status on public.withdrawals
  for each row execute function public.handle_withdrawal_completed();

-- Label artist limit (starter = 5)
create or replace function public.enforce_label_artist_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.label_plan;
  v_count int;
begin
  if new.label_id is null then
    return new;
  end if;

  select label_plan into v_plan from public.profiles where id = new.label_id;
  if v_plan = 'starter' then
    select count(*) into v_count from public.artists where label_id = new.label_id;
    if tg_op = 'INSERT' and v_count >= 5 then
      raise exception 'Plan Starter limité à 5 artistes';
    end if;
  elsif v_plan = 'none' then
    raise exception 'Abonnement label requis';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_label_artist_limit on public.artists;
create trigger enforce_label_artist_limit
  before insert on public.artists
  for each row execute function public.enforce_label_artist_limit();

-- RLS
alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.releases enable row level security;
alter table public.tracks enable row level security;
alter table public.purchases enable row level security;
alter table public.withdrawals enable row level security;
alter table public.favorites enable row level security;
alter table public.library_items enable row level security;

-- Profiles
create policy "profiles_select_own_or_public"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Artists
create policy "artists_select_all"
  on public.artists for select
  using (true);

create policy "artists_insert_own_or_label"
  on public.artists for insert
  with check (
    auth.uid() = owner_id
    or auth.uid() = label_id
  );

create policy "artists_update_own_or_label"
  on public.artists for update
  using (auth.uid() = owner_id or auth.uid() = label_id)
  with check (auth.uid() = owner_id or auth.uid() = label_id);

create policy "artists_delete_own_or_label"
  on public.artists for delete
  using (auth.uid() = owner_id or auth.uid() = label_id);

-- Releases
create policy "releases_select_published_or_owner"
  on public.releases for select
  using (status = 'published' or auth.uid() = owner_id);

create policy "releases_insert_owner"
  on public.releases for insert
  with check (auth.uid() = owner_id);

create policy "releases_update_owner"
  on public.releases for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "releases_delete_owner"
  on public.releases for delete
  using (auth.uid() = owner_id);

-- Tracks
create policy "tracks_select_via_release"
  on public.tracks for select
  using (
    exists (
      select 1 from public.releases r
      where r.id = release_id
        and (r.status = 'published' or r.owner_id = auth.uid())
    )
  );

create policy "tracks_mutate_owner"
  on public.tracks for all
  using (
    exists (
      select 1 from public.releases r
      where r.id = release_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.releases r
      where r.id = release_id and r.owner_id = auth.uid()
    )
  );

-- Purchases
create policy "purchases_select_buyer_or_seller"
  on public.purchases for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "purchases_insert_buyer"
  on public.purchases for insert
  with check (auth.uid() = buyer_id);

-- Withdrawals
create policy "withdrawals_select_own"
  on public.withdrawals for select
  using (auth.uid() = profile_id);

create policy "withdrawals_insert_own"
  on public.withdrawals for insert
  with check (auth.uid() = profile_id);

-- Favorites
create policy "favorites_own"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Library
create policy "library_own"
  on public.library_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
