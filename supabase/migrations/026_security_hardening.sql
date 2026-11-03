-- 026 — Durcissement sécurité (audit du 3 novembre 2026)
--
-- Failles corrigées (toutes exploitables avec la clé publique « anon ») :
--  1. profiles lisibles par tout le monde (email, téléphone, solde, is_admin).
--  2. Un utilisateur pouvait modifier son solde et ses abonnements.
--  3. Un utilisateur pouvait créer un achat « completed » → crédit de solde.
--  4. Un utilisateur pouvait s'ajouter n'importe quelle release en bibliothèque.
--  5. Création directe de retraits / commandes d'abonnement côté client.
--  6. Un artiste pouvait se certifier lui-même (artists.is_verified).
--  7. Plusieurs retraits simultanés pouvaient dépasser le solde.
--  8. Un utilisateur pouvait modifier ses retraits (montant négatif = crédit).
--  9. Un artiste pouvait réafficher une sortie masquée par l'admin.
--
-- Le serveur (clé service_role) n'est pas concerné par ces règles :
-- toutes les écritures sensibles passent désormais par lui.

begin;

-- ── 1. Profils : chacun ne lit que le sien ──────────────────────────────
drop policy if exists "profiles_select_own_or_public" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- ── 2. Colonnes protégées du profil ─────────────────────────────────────
create or replace function public.protect_profile_security_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.login_otp_verified_at := old.login_otp_verified_at;
  new.is_admin := old.is_admin;
  new.is_suspended := old.is_suspended;
  new.role := old.role;
  new.balance_fcfa := old.balance_fcfa;
  new.artist_plan := old.artist_plan;
  new.artist_plan_expires_at := old.artist_plan_expires_at;
  new.label_plan := old.label_plan;
  new.label_plan_expires_at := old.label_plan_expires_at;
  return new;
end;
$$;

drop trigger if exists profiles_protect_security_columns on public.profiles;
create trigger profiles_protect_security_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_security_columns();

-- ── 3. Achats : création uniquement par le serveur ──────────────────────
drop policy if exists "purchases_insert_buyer" on public.purchases;

-- ── 4. Bibliothèque : lecture seule côté client ────────────────────────
drop policy if exists "library_own" on public.library_items;
drop policy if exists "library_select_own" on public.library_items;
create policy "library_select_own"
  on public.library_items for select
  using (auth.uid() = user_id);

-- ── 5. Retraits et commandes d'abonnement : serveur uniquement ─────────
drop policy if exists "withdrawals_insert_own" on public.withdrawals;
drop policy if exists "withdrawals_update_own" on public.withdrawals;
drop policy if exists "artist_plan_orders_insert_own" on public.artist_plan_orders;
drop policy if exists "label_plan_orders_insert_own" on public.label_plan_orders;
drop policy if exists "label_plan_orders_update_own" on public.label_plan_orders;

-- ── 6. Certification réservée à l'admin ─────────────────────────────────
create or replace function public.protect_artist_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_verified := false;
  else
    new.is_verified := old.is_verified;
  end if;
  return new;
end;
$$;

drop trigger if exists artists_protect_verified on public.artists;
create trigger artists_protect_verified
  before insert or update on public.artists
  for each row
  execute function public.protect_artist_verified();

-- ── 6 bis. Masquage des sorties réservé à l'admin ──────────────────────
create or replace function public.protect_release_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_hidden := false;
    new.hidden_by_suspension := false;
  else
    new.is_hidden := old.is_hidden;
    new.hidden_by_suspension := old.hidden_by_suspension;
  end if;
  return new;
end;
$$;

drop trigger if exists releases_protect_moderation on public.releases;
create trigger releases_protect_moderation
  before insert or update on public.releases
  for each row
  execute function public.protect_release_moderation();

-- ── 7. Un seul retrait en attente par compte ───────────────────────────
create unique index if not exists withdrawals_one_pending_per_profile
  on public.withdrawals (profile_id)
  where status = 'pending';

commit;
