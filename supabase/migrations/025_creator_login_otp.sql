-- OTP première connexion app créateur (artiste / label)

alter table public.profiles
  add column if not exists login_otp_verified_at timestamptz;

comment on column public.profiles.login_otp_verified_at is
  'Première vérification OTP (app créateur). Null = jamais vérifié.';

create table if not exists public.creator_login_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  session_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists creator_login_challenges_user_idx
  on public.creator_login_challenges (user_id, created_at desc);

create index if not exists creator_login_challenges_expires_idx
  on public.creator_login_challenges (expires_at);

alter table public.creator_login_challenges enable row level security;

-- Aucun accès client : lecture/écriture service_role uniquement
drop policy if exists creator_login_challenges_deny_all
  on public.creator_login_challenges;
create policy creator_login_challenges_deny_all
  on public.creator_login_challenges
  for all
  using (false)
  with check (false);

revoke all on public.creator_login_challenges from anon, authenticated;
revoke all on public.creator_login_challenges from public;

-- Empêche un client de s'auto-valider l'OTP / de se désuspendre / de changer de rôle
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
  return new;
end;
$$;

drop trigger if exists profiles_protect_security_columns on public.profiles;
create trigger profiles_protect_security_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_security_columns();
