-- Onboarding créateur + genres profil

alter table public.profiles
  add column if not exists bio text,
  add column if not exists genres text[] not null default '{}',
  add column if not exists onboarding_completed boolean not null default false;

comment on column public.profiles.bio is 'Description courte (max ~60 mots)';
comment on column public.profiles.genres is 'Genres musicaux préférés / catalogue';
comment on column public.profiles.onboarding_completed is 'Profil créateur complété (artiste/label)';

-- Fans et comptes déjà remplis : considérer l'onboarding terminé
update public.profiles
set onboarding_completed = true
where role = 'fan'
   or (display_name is not null and display_name <> '');

-- Signup minimal : ne plus créer la fiche artiste ici (faite à l'onboarding)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'fan');
begin
  insert into public.profiles (id, email, role, onboarding_completed)
  values (
    new.id,
    new.email,
    v_role,
    case when v_role = 'fan' then true else false end
  );

  return new;
end;
$$;
