-- MBIYOPAY collect : refs provider + réseaux additionnels

do $$ begin
  alter type public.payment_method add value if not exists 'vodacom';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.payment_method add value if not exists 'moov';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.payment_method add value if not exists 'africell';
exception when duplicate_object then null;
end $$;

alter table public.purchases
  add column if not exists order_id text,
  add column if not exists provider text not null default 'mbiyo',
  add column if not exists provider_transaction_id text,
  add column if not exists payer_phone text,
  add column if not exists provider_meta jsonb not null default '{}'::jsonb;

create unique index if not exists purchases_order_id_uidx
  on public.purchases (order_id)
  where order_id is not null;

create index if not exists purchases_provider_tx_idx
  on public.purchases (provider_transaction_id);
