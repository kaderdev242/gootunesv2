-- Notifications push de l'app Gootunes Artistes (Firebase Cloud Messaging).
-- Un appareil = un jeton FCM, rattaché au compte artiste ou label connecté.
-- Accès uniquement via le service role (routes API serveur) : RLS sans policy.

create table if not exists public.creator_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_push_tokens_user_idx
  on public.creator_push_tokens (user_id);

alter table public.creator_push_tokens enable row level security;
