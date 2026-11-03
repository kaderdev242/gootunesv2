/**
 * Messages d'erreur clairs pour l'utilisateur (prod).
 * Les détails techniques restent côté logs serveur.
 */

export const USER_ERRORS = {
  generic: "Une erreur est survenue. Réessaie dans un instant.",
  network: "Connexion impossible. Vérifie ta connexion puis réessaie.",
  auth: "Identifiants incorrects. Vérifie ton email et mot de passe.",
  authSession: "Session expirée. Reconnecte-toi.",
  authExists: "Un compte existe déjà avec cet email.",
  authWeakPassword: "Mot de passe trop faible (6 caractères minimum).",
  authEmail: "Email invalide.",
  authConfirm: "Confirme ton email avant de te connecter.",
  forbidden: "Tu n'as pas accès à cette action.",
  notFound: "Élément introuvable.",
  validation: "Certaines informations sont invalides.",
  upload: "Upload impossible. Réessaie avec un autre fichier.",
  payment: "Paiement impossible pour le moment. Réessaie.",
  paymentPhone: "Numéro ou opérateur non accepté. Vérifie et réessaie.",
  paymentBalance: "Solde insuffisant pour cette opération.",
  paymentKyc: "Compte marchand non vérifié (KYC). Contacte le support.",
  withdrawal: "Retrait impossible pour le moment. Réessaie.",
  publish: "Publication impossible. Vérifie les infos et réessaie.",
  duplicate: "Cet élément existe déjà.",
  rateLimit: "Trop de tentatives. Attends un moment puis réessaie.",
} as const;

function asText(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

/** Log serveur sans exposer à l'utilisateur. Persisté pour l’admin (Logs système). */
export function logServerError(scope: string, err: unknown, extra?: unknown) {
  if (extra !== undefined) {
    console.error(`[${scope}]`, err, extra);
  } else {
    console.error(`[${scope}]`, err);
  }
  void import("@/lib/system-log")
    .then(({ persistSystemLog, errText, errStack }) => {
      let extraValue: string | null = null;
      if (extra !== undefined) {
        try {
          extraValue =
            typeof extra === "string" ? extra : JSON.stringify(extra);
        } catch {
          extraValue = String(extra);
        }
      }
      return persistSystemLog({
        source: "server",
        path: scope,
        message: `[${scope}] ${errText(err) || "Erreur"}`,
        stack: errStack(err),
        context: extraValue ? { scope, extra: extraValue } : { scope },
      });
    })
    .catch(() => undefined);
}

/** Déjà un message FR « produit » (court, sans jargon technique). */
export function isUserFacingMessage(message: string): boolean {
  const m = message.trim();
  if (!m || m.length > 160) return false;
  // Anglais / jargon tech → à mapper
  if (/violates|constraint|row-level|JWT|stack|ECONN|ENOTFOUND|postgres|supabase|rls|hmac|timeout|undefined|null reference/i.test(m)) {
    return false;
  }
  if (/^(error|failed|invalid|unauthorized|forbidden|internal)/i.test(m)) {
    return false;
  }
  // Phrases FR typiques du produit
  if (/[àâäéèêëïîôùûüçœ]/i.test(m) || /['’]/.test(m)) return true;
  if (/^(Connecte|Reconnecte|Impossible|Montant|Numéro|Prix|Titre|Email|Mot de passe|Solde|Paiement|Retrait|Publication|Artiste|Cover|Playlist|Compte|Session|Opérateur|Abonnement)/i.test(m)) {
    return true;
  }
  return false;
}

export function mapAuthError(err: unknown): string {
  const raw = asText(err).toLowerCase();
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code?: string }).code || "").toLowerCase()
      : "";

  if (
    code.includes("invalid_credentials") ||
    raw.includes("invalid login") ||
    raw.includes("invalid credentials")
  ) {
    return USER_ERRORS.auth;
  }
  if (
    code.includes("user_already_exists") ||
    raw.includes("already registered") ||
    raw.includes("already been registered") ||
    raw.includes("user already")
  ) {
    return USER_ERRORS.authExists;
  }
  if (
    code.includes("email_not_confirmed") ||
    raw.includes("email not confirmed")
  ) {
    return USER_ERRORS.authConfirm;
  }
  if (
    code.includes("weak_password") ||
    (raw.includes("password") && raw.includes("least"))
  ) {
    return USER_ERRORS.authWeakPassword;
  }
  if (raw.includes("invalid email") || code.includes("validation_failed")) {
    return USER_ERRORS.authEmail;
  }
  if (raw.includes("rate limit") || raw.includes("too many")) {
    return USER_ERRORS.rateLimit;
  }
  if (isUserFacingMessage(asText(err))) return asText(err).trim();
  return USER_ERRORS.auth;
}

export function mapDbError(
  err: unknown,
  fallback: string = USER_ERRORS.generic,
): string {
  const raw = asText(err).toLowerCase();
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code?: string }).code || "")
      : "";

  if (code === "23505" || raw.includes("duplicate key") || raw.includes("unique constraint")) {
    return USER_ERRORS.duplicate;
  }
  if (
    code === "42501" ||
    raw.includes("row-level security") ||
    raw.includes("permission denied")
  ) {
    return USER_ERRORS.forbidden;
  }
  if (code === "23503" || raw.includes("foreign key")) {
    return USER_ERRORS.notFound;
  }
  if (raw.includes("solde insuffisant")) {
    return USER_ERRORS.paymentBalance;
  }
  if (isUserFacingMessage(asText(err))) return asText(err).trim();
  return fallback;
}

export function mapPaymentError(err: unknown, kind: "payin" | "payout" = "payin"): string {
  const raw = asText(err).toLowerCase();

  if (
    raw.includes("phone") ||
    raw.includes("network") ||
    raw.includes("unsupported")
  ) {
    return USER_ERRORS.paymentPhone;
  }
  if (raw.includes("kyc")) return USER_ERRORS.paymentKyc;
  if (raw.includes("insufficient") || raw.includes("balance")) {
    return kind === "payout"
      ? "Portefeuille marchand insuffisant pour ce retrait. Réessaie plus tard."
      : USER_ERRORS.paymentBalance;
  }
  if (raw.includes("minimum") || raw.includes("limit")) {
    return "Montant hors limites pour cet opérateur. Vérifie le prix ou le montant.";
  }
  if (raw.includes("timeout") || raw.includes("network error") || raw.includes("fetch")) {
    return USER_ERRORS.network;
  }
  if (isUserFacingMessage(asText(err))) return asText(err).trim();
  return kind === "payout" ? USER_ERRORS.withdrawal : USER_ERRORS.payment;
}

export function mapUploadError(err: unknown): string {
  const raw = asText(err).toLowerCase();
  if (raw.includes("mp3")) return "Seuls les fichiers MP3 sont acceptés.";
  if (raw.includes("image") || raw.includes("cover") || raw.includes("1000")) {
    return asText(err).includes("1000")
      ? asText(err)
      : "Image invalide. Utilise une cover 1000×1000.";
  }
  if (
    raw.includes("max") ||
    raw.includes("trop lourd") ||
    raw.includes("trop volumineux") ||
    raw.includes("size")
  ) {
    return asText(err).includes("50")
      ? "Audio trop volumineux (max 50 Mo)."
      : "Fichier trop volumineux.";
  }
  if (
    raw.includes("cors") ||
    raw.includes("blocked") ||
    raw.includes("accès stockage") ||
    raw.includes("refusé")
  ) {
    return asText(err).trim() || USER_ERRORS.upload;
  }
  if (
    raw.includes("configuration r2") ||
    raw.includes("bucket r2") ||
    raw.includes("url publique r2")
  ) {
    return "Stockage non configuré. Contacte le support.";
  }
  if (raw.includes("authentif") || raw.includes("unauthorized") || raw.includes("401")) {
    return USER_ERRORS.authSession;
  }
  if (isUserFacingMessage(asText(err))) return asText(err).trim();
  return USER_ERRORS.upload;
}

/** Point d'entrée générique pour actions / catch clients. */
export function toUserError(
  err: unknown,
  fallback: string = USER_ERRORS.generic as string,
): string {
  const raw = asText(err);
  if (!raw) return fallback;
  if (isUserFacingMessage(raw)) return raw.trim();

  const lower = raw.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("already registered") ||
    lower.includes("email not confirmed")
  ) {
    return mapAuthError(err);
  }
  if (
    lower.includes("duplicate") ||
    lower.includes("row-level") ||
    lower.includes("violates")
  ) {
    return mapDbError(err, fallback);
  }
  if (
    lower.includes("mbiyo") ||
    lower.includes("payin") ||
    lower.includes("payout") ||
    lower.includes("mobile_money") ||
    lower.includes("phone number") ||
    lower.includes("insufficient balance") ||
    lower.includes("kyc")
  ) {
    return mapPaymentError(err);
  }
  if (
    lower.includes("r2") ||
    lower.includes("upload") ||
    lower.includes("s3") ||
    lower.includes("bucket")
  ) {
    return mapUploadError(err);
  }
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("econn")) {
    return USER_ERRORS.network;
  }

  return fallback;
}
