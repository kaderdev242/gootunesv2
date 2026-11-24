-- Envois groupés depuis l'admin : notifications push et e-mails.
-- Historique de chaque envoi (qui, quand, à qui, combien reçus / en échec).
-- Accès uniquement via le service role (actions admin) : RLS sans policy.

create table if not exists public.admin_broadcasts (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('push', 'email')),
  audience text not null,
  target_email text,
  title text not null,
  body text not null,
  cta_url text,
  recipients integer not null default 0,
  sent integer not null default 0,
  failed integer not null default 0,
  is_test boolean not null default false,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admin_broadcasts_created_idx
  on public.admin_broadcasts (channel, created_at desc);

alter table public.admin_broadcasts enable row level security;
