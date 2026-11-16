-- 029 — Prods (instrumentaux des beatmakers), web uniquement.
--
-- 100 % ADDITIF : aucune table, colonne, enum ou policy existante n'est modifiée.
--   • `releases` / `tracks` / `purchases` restent intacts → Discover et les applis
--     iOS / Android ne voient jamais les prods.
--   • Retour arrière : supabase/migrations/029_prods_down.sql
--
-- Fichiers (R2, clés sous audios/{uid}/prods/…) :
--   • demo_key  (beats)       : MP3 tagué, aperçu public (servi via URL signée)
--   • mp3/wav/stems (beat_files): livrables SANS tag — aucune policy client,
--     lisibles uniquement par le service role après achat vérifié.

-- ── Interrupteur admin (désactivé par défaut) ────────────────────────────────
insert into public.feature_flags (key, enabled)
values ('prods', false)
on conflict (key) do nothing;

-- ── Beats ────────────────────────────────────────────────────────────────────
create table if not exists public.beats (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.random_public_id(8),
  artist_id uuid not null references public.artists (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  cover_url text,
  genre text,
  mood text,
  bpm int check (bpm is null or bpm between 40 and 300),
  musical_key text,
  tags text[] not null default '{}',
  demo_key text not null,
  duration_seconds int,
  price_mp3_fcfa numeric(14,2) check (price_mp3_fcfa is null or price_mp3_fcfa > 0),
  price_wav_fcfa numeric(14,2) check (price_wav_fcfa is null or price_wav_fcfa > 0),
  price_stems_fcfa numeric(14,2) check (price_stems_fcfa is null or price_stems_fcfa > 0),
  credits jsonb not null default '{}'::jsonb,
  status public.release_status not null default 'published',
  is_hidden boolean not null default false,
  plays_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beats_one_license check (
    price_mp3_fcfa is not null or price_wav_fcfa is not null or price_stems_fcfa is not null
  )
);

create index if not exists beats_public_listing_idx
  on public.beats (created_at desc)
  where status = 'published' and is_hidden = false;
create index if not exists beats_owner_idx on public.beats (owner_id, created_at desc);
create index if not exists beats_artist_idx on public.beats (artist_id);

alter table public.beats enable row level security;

-- Lecture : publiées, visibles, propriétaire non suspendu — ou le propriétaire lui-même.
-- Écriture : uniquement via le serveur (service role), après contrôle d'accès.
drop policy if exists "beats_select_public_or_owner" on public.beats;
create policy "beats_select_public_or_owner"
  on public.beats for select
  using (
    owner_id = auth.uid()
    or (
      status = 'published'
      and is_hidden = false
      and not exists (
        select 1 from public.profiles p
        where p.id = beats.owner_id and coalesce(p.is_suspended, false)
      )
    )
  );

-- ── Livrables privés (aucune policy = aucun accès client) ────────────────────
create table if not exists public.beat_files (
  beat_id uuid primary key references public.beats (id) on delete cascade,
  mp3_key text,
  wav_key text,
  stems_key text,
  created_at timestamptz not null default now()
);

alter table public.beat_files enable row level security;

-- ── Commandes de prods (séparées de `purchases`) ─────────────────────────────
create table if not exists public.beat_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  beat_id uuid not null references public.beats (id) on delete cascade,
  license text not null check (license in ('mp3', 'wav', 'stems')),
  amount_fcfa numeric(14,2) not null check (amount_fcfa >= 0),
  commission_fcfa numeric(14,2) not null check (commission_fcfa >= 0),
  artist_net_fcfa numeric(14,2) not null check (artist_net_fcfa >= 0),
  payment_method public.payment_method not null,
  status public.payment_status not null default 'pending',
  provider text not null default 'mbiyo',
  provider_transaction_id text,
  payer_phone text,
  provider_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beat_orders_buyer_idx on public.beat_orders (buyer_id, created_at desc);
create index if not exists beat_orders_seller_idx on public.beat_orders (seller_id, created_at desc);
create index if not exists beat_orders_beat_idx on public.beat_orders (beat_id);

alter table public.beat_orders enable row level security;

drop policy if exists "beat_orders_select_party" on public.beat_orders;
create policy "beat_orders_select_party"
  on public.beat_orders for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Crédit du solde vendeur à la complétion (même logique que les achats musique).
create or replace function public.handle_beat_order_completed()
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
  end if;
  return new;
end;
$$;

drop trigger if exists on_beat_order_completed on public.beat_orders;
create trigger on_beat_order_completed
  after insert or update of status on public.beat_orders
  for each row execute function public.handle_beat_order_completed();

-- Compteur d'écoutes des démos (appelé par le serveur)
create or replace function public.increment_beat_plays(p_beat_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.beats set plays_count = plays_count + 1 where id = p_beat_id;
$$;

revoke all on function public.increment_beat_plays(uuid) from public, anon, authenticated;
