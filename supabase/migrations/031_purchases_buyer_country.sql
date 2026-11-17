-- 031 — Pays de l'acheteur figé au moment de l'achat (stats « Pays des achats »).
-- Les créateurs ne peuvent pas lire le profil de leurs acheteurs (RLS profiles_select_own),
-- le pays est donc recopié dans la vente elle-même.
--
-- Additif : une colonne nullable + un trigger BEFORE INSERT qui ne fait que la remplir.
-- Retour arrière :
--   drop trigger if exists purchases_set_buyer_country on public.purchases;
--   drop trigger if exists beat_orders_set_buyer_country on public.beat_orders;
--   drop function if exists public.set_buyer_country();
--   alter table public.purchases drop column if exists buyer_country;
--   alter table public.beat_orders drop column if exists buyer_country;

alter table public.purchases add column if not exists buyer_country text;
alter table public.beat_orders add column if not exists buyer_country text;

create or replace function public.set_buyer_country()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.buyer_country is null then
    new.buyer_country := coalesce(
      nullif(new.provider_meta ->> 'country_code', ''),
      (select p.country from public.profiles p where p.id = new.buyer_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists purchases_set_buyer_country on public.purchases;
create trigger purchases_set_buyer_country
  before insert on public.purchases
  for each row execute function public.set_buyer_country();

drop trigger if exists beat_orders_set_buyer_country on public.beat_orders;
create trigger beat_orders_set_buyer_country
  before insert on public.beat_orders
  for each row execute function public.set_buyer_country();

-- Ventes existantes : pays du réseau Mobile Money s'il est connu, sinon pays du profil.
update public.purchases pu
set buyer_country = coalesce(nullif(pu.provider_meta ->> 'country_code', ''), pr.country)
from public.profiles pr
where pr.id = pu.buyer_id and pu.buyer_country is null;

update public.beat_orders bo
set buyer_country = coalesce(nullif(bo.provider_meta ->> 'country_code', ''), pr.country)
from public.profiles pr
where pr.id = bo.buyer_id and bo.buyer_country is null;
