-- 033 — Contrats créateurs (artistes et labels) signés électroniquement.
--
-- Additif : une table + RLS. Le créateur lit ses propres contrats ; les écritures
-- passent uniquement par le service role (actions serveur). Les contrats sont
-- conservés même si le compte est supprimé (user_id passe à null, l'instantané
-- des informations du signataire reste dans `party`).
-- Retour arrière :
--   drop table if exists public.creator_contracts;

create table if not exists public.creator_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  role text not null check (role in ('artist', 'label')),
  contract_version text not null,
  -- Informations préremplies au moment de la signature (nom légal, nom de scène, contact, pays).
  party jsonb not null,
  signer_name text not null check (char_length(signer_name) between 2 and 160),
  -- Signature manuscrite dessinée à l'écran (PNG en data URL).
  signature_png text not null check (signature_png like 'data:image/png;base64,%' and char_length(signature_png) <= 400000),
  -- Empreinte SHA-256 du texte exact signé.
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  signed_ip text,
  signed_user_agent text,
  signed_at timestamptz not null default now(),
  unique (user_id, contract_version)
);

create index if not exists creator_contracts_signed_at_idx on public.creator_contracts (signed_at desc);

alter table public.creator_contracts enable row level security;

drop policy if exists creator_contracts_select_own on public.creator_contracts;
create policy creator_contracts_select_own on public.creator_contracts
  for select
  using (auth.uid() = user_id);
