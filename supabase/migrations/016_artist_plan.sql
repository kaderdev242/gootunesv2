-- Abonnement artiste annuel (publication illimitée 1 an)

do $$ begin
  create type public.artist_plan as enum ('none', 'annual');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists artist_plan public.artist_plan not null default 'none',
  add column if not exists artist_plan_expires_at timestamptz;

create table if not exists public.artist_plan_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null check (plan = 'annual'),
  amount_fcfa int not null check (amount_fcfa > 0),
  payment_method public.payment_method not null,
  order_id text not null unique,
  status public.payment_status not null default 'pending',
  provider text not null default 'mbiyo',
  provider_transaction_id text,
  payer_phone text,
  provider_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists artist_plan_orders_user_idx
  on public.artist_plan_orders (user_id, created_at desc);

alter table public.artist_plan_orders enable row level security;

drop policy if exists "artist_plan_orders_select_own" on public.artist_plan_orders;
create policy "artist_plan_orders_select_own"
  on public.artist_plan_orders for select
  using (auth.uid() = user_id);

drop policy if exists "artist_plan_orders_insert_own" on public.artist_plan_orders;
create policy "artist_plan_orders_insert_own"
  on public.artist_plan_orders for insert
  with check (auth.uid() = user_id);
