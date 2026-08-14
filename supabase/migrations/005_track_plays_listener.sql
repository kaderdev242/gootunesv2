-- Permettre à un fan de lire ses propres écoutes (Écouter récemment)
-- Si deadlock : arrête le serveur Next (npm run dev), exécute ce SQL, puis relance.
-- Tu peux aussi coller les 2 blocs séparément dans le SQL Editor.

-- 1) Policy (léger)
drop policy if exists "track_plays_select_listener" on public.track_plays;

create policy "track_plays_select_listener"
  on public.track_plays for select
  to authenticated
  using (listener_id = auth.uid());

-- 2) Index (peut attendre que les lectures se terminent)
create index if not exists track_plays_listener_id_idx
  on public.track_plays (listener_id, created_at desc);
