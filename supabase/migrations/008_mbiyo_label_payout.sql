-- Abonnements label (payin) + retraits (payout) MBIYOPAY

create table if not exists public.label_plan_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan public.label_plan not null check (plan in ('starter', 'unlimited')),
  amount_fcfa numeric(14,2) not null check (amount_fcfa > 0),
  payment_method public.payment_method not null,
  order_id text not null,
  status public.payment_status not null default 'pending',
  provider text not null default 'mbiyo',
  provider_transaction_id text,
  payer_phone text,
  provider_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint label_plan_orders_order_id_key unique (order_id)
);

create index if not exists label_plan_orders_user_idx
  on public.label_plan_orders (user_id, created_at desc);

alter table public.withdrawals
  add column if not exists order_id text,
  add column if not exists provider text not null default 'mbiyo',
  add column if not exists provider_transaction_id text,
  add column if not exists beneficiary text,
  add column if not exists provider_meta jsonb not null default '{}'::jsonb;

create unique index if not exists withdrawals_order_id_uidx
  on public.withdrawals (order_id)
  where order_id is not null;

-- Solde : réserve au pending, rembourse si failed/cancelled, débité une seule fois
create or replace function public.handle_withdrawal_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert pending → réserve le solde
  if tg_op = 'INSERT' and new.status = 'pending' then
    update public.profiles
      set balance_fcfa = balance_fcfa - new.amount_fcfa
      where id = new.profile_id
        and balance_fcfa >= new.amount_fcfa;
    if not found then
      raise exception 'Solde insuffisant';
    end if;
    return new;
  end if;

  -- Insert completed (mode démo / legacy) → débit immédiat
  if tg_op = 'INSERT' and new.status = 'completed' then
    update public.profiles
      set balance_fcfa = balance_fcfa - new.amount_fcfa
      where id = new.profile_id
        and balance_fcfa >= new.amount_fcfa;
    if not found then
      raise exception 'Solde insuffisant';
    end if;
    return new;
  end if;

  -- pending → failed/cancelled → rembourse
  if tg_op = 'UPDATE'
     and old.status = 'pending'
     and new.status in ('failed', 'cancelled') then
    update public.profiles
      set balance_fcfa = balance_fcfa + new.amount_fcfa
      where id = new.profile_id;
    return new;
  end if;

  -- pending → completed : déjà réservé, rien à faire
  return new;
end;
$$;

alter table public.label_plan_orders enable row level security;

create policy "label_plan_orders_select_own"
  on public.label_plan_orders for select
  using (auth.uid() = user_id);

create policy "label_plan_orders_insert_own"
  on public.label_plan_orders for insert
  with check (auth.uid() = user_id);

create policy "label_plan_orders_update_own"
  on public.label_plan_orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "withdrawals_update_own"
  on public.withdrawals for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
