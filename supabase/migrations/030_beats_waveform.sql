-- 030 — Waveform réelle des démos de prods (pics calculés dans le navigateur à l'upload).
-- Additif : une colonne nullable. Retour arrière :
--   alter table public.beats drop column if exists waveform;

alter table public.beats
  add column if not exists waveform smallint[];

comment on column public.beats.waveform is
  'Pics de la démo (0–100), ~160 valeurs, calculés depuis le fichier audio à la publication.';
