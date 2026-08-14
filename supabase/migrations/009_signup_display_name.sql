-- Enregistre pseudo + pays dès l'inscription (metadata auth)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'fan'
  );
  v_display text := nullif(trim(new.raw_user_meta_data->>'display_name'), '');
  v_country text := nullif(trim(new.raw_user_meta_data->>'country'), '');
begin
  insert into public.profiles (
    id,
    email,
    role,
    display_name,
    country,
    onboarding_completed
  )
  values (
    new.id,
    new.email,
    v_role,
    v_display,
    v_country,
    case when v_role = 'fan' then true else false end
  );

  return new;
end;
$$;
