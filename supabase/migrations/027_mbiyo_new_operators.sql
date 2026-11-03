-- 027 — Nouveaux opérateurs Mobile Money (Burkina Faso, Bénin, Sénégal)
-- Free Money (SN), Coris Money (BF), Celtiis Cash (BJ).
-- Les valeurs d'enum doivent exister avant qu'un utilisateur ne les choisisse.

alter type public.payment_method add value if not exists 'free';
alter type public.payment_method add value if not exists 'coris';
alter type public.payment_method add value if not exists 'celtiis';
