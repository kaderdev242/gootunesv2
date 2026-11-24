-- Journal des événements de paiement Mobile Money (Mbiyo).
-- Chaque webhook reçu, chaque rapprochement automatique et chaque action admin
-- (vérification, validation manuelle, renvoi de webhook) laisse une trace :
-- on sait toujours pourquoi une commande est passée réussie ou en échec.
-- Accès uniquement via le service role (routes serveur et admin) : RLS sans policy.

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  transaction_id text,
  source text not null check (source in ('webhook', 'reconcile', 'admin')),
  mbiyo_status text,
  outcome text not null,
  detail text not null default '',
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_order_idx
  on public.payment_events (order_id, created_at desc);

create index if not exists payment_events_created_idx
  on public.payment_events (created_at desc);

alter table public.payment_events enable row level security;
