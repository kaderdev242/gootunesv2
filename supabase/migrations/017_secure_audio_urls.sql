-- Migration 017: Sécurisation des URLs audio
-- Objectif : stocker la clé R2 (ex: "audios/userId/file.mp3") au lieu de l'URL publique complète
-- afin que les clients ne puissent pas télécharger directement les fichiers audio depuis R2.

-- ════════════════════════════════════════════════════════════════════════════
-- 1. Migrer les audio_url existants : strip de l'URL publique → clé R2 pure
--    Remplace : https://pub-xxxx.r2.dev/audios/... → audios/...
-- ════════════════════════════════════════════════════════════════════════════

-- Détection dynamique du préfixe public R2 (adapte si besoin)
DO $$
DECLARE
  v_prefix TEXT := 'https://pub-7e4123d3d49b46288415accf758a1626.r2.dev/';
  v_updated INT;
BEGIN
  UPDATE public.tracks
  SET audio_url = substring(audio_url FROM length(v_prefix) + 1)
  WHERE audio_url LIKE v_prefix || '%';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Migration audio_url : % enregistrement(s) mis à jour', v_updated;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Restreindre l'accès à audio_url via l'API client Supabase
--    On crée une vue "tracks_safe" sans audio_url exposable aux clients,
--    et on crée une fonction sécurisée pour récupérer la clé audio
--    uniquement si l'utilisateur a accès au morceau.
-- ════════════════════════════════════════════════════════════════════════════

-- Vue publique sans audio_url (utilisée pour les listings, découverte, etc.)
CREATE OR REPLACE VIEW public.tracks_safe AS
SELECT
  id,
  release_id,
  title,
  track_number,
  duration_seconds,
  price_fcfa,
  credits,
  created_at
  -- audio_url intentionnellement absent
FROM public.tracks;

GRANT SELECT ON public.tracks_safe TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Fonction SECURITY DEFINER pour récupérer audio_url
--    Ne retourne la clé que si le release est publié OU si c'est le propriétaire.
--    La résolution vers une URL signée est faite côté serveur Next.js.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_track_audio_key(p_track_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audio_url TEXT;
  v_owner_id  UUID;
  v_status    TEXT;
BEGIN
  SELECT t.audio_url, r.owner_id, r.status
  INTO   v_audio_url, v_owner_id, v_status
  FROM   public.tracks  t
  JOIN   public.releases r ON r.id = t.release_id
  WHERE  t.id = p_track_id
  LIMIT  1;

  -- Introuvable
  IF v_audio_url IS NULL THEN RETURN NULL; END IF;

  -- Accès autorisé : release publié OU propriétaire connecté
  IF v_status = 'published' OR auth.uid() = v_owner_id THEN
    RETURN v_audio_url;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_track_audio_key(UUID) TO authenticated;
-- anon : pas d'accès à audio_key (même pour les releases publics)
REVOKE EXECUTE ON FUNCTION public.get_track_audio_key(UUID) FROM anon;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. Ajouter un index sur audio_url pour accélérer la migration + lookups futurs
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tracks_audio_url ON public.tracks (audio_url)
  WHERE audio_url IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. Log d'audit des accès stream (optionnel mais recommandé)
--    Pour détecter les abus (10 000 requêtes/h depuis un compte, etc.)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.stream_audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  track_id   UUID NOT NULL REFERENCES public.tracks (id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ip_hash    TEXT,                        -- Hash SHA-256 de l'IP (RGPD-friendly)
  access_type TEXT NOT NULL DEFAULT 'preview', -- 'preview' | 'full'
  bytes_served BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stream_audit_logs ENABLE ROW LEVEL SECURITY;

-- Seul le service_role peut lire les logs (admin uniquement)
CREATE POLICY "audit_logs_admin_only"
  ON public.stream_audit_logs FOR ALL
  USING (false);

-- Index pour les requêtes analytiques (abus par user, par track)
CREATE INDEX IF NOT EXISTS idx_audit_track_time  ON public.stream_audit_logs (track_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_time   ON public.stream_audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ip_time     ON public.stream_audit_logs (ip_hash, created_at DESC);
