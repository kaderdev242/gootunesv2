-- RETOUR ARRIÈRE de 029_prods.sql — à n'exécuter QUE pour annuler les prods.
--
-- ⚠️ Supprime les beats, leurs commandes et l'historique de ventes de prods.
--    Les soldes déjà crédités aux beatmakers (profiles.balance_fcfa) ne sont PAS
--    retirés : l'argent reste acquis aux vendeurs.
--
-- Pour simplement masquer les prods sans rien supprimer, désactive plutôt
-- l'interrupteur « Prods » dans /goo-admin/fonctionnalites.
--
-- Les fichiers R2 (audios/{uid}/prods/…) ne sont pas effacés par ce script.

drop trigger if exists on_beat_order_completed on public.beat_orders;
drop function if exists public.handle_beat_order_completed();
drop function if exists public.increment_beat_plays(uuid);

drop table if exists public.beat_orders;
drop table if exists public.beat_files;
drop table if exists public.beats;

delete from public.feature_flags where key = 'prods';
