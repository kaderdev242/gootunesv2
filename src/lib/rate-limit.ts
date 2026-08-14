/**
 * Rate limiter in-memory — adapté serverless (Vercel/Node.js).
 * Pour un déploiement multi-instance à grande échelle, migrer vers Upstash Redis.
 *
 * Algorithme : sliding window (fenêtre glissante simple).
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

/** Nettoyage périodique pour éviter les fuites mémoire sur instances longue durée. */
function pruneExpired(): void {
  if (store.size < 5_000) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Vérifie et incrémente le compteur pour une clé donnée.
 *
 * @param key      Identifiant unique (ex. `"stream:${ip}"`)
 * @param limit    Nombre max de requêtes autorisées dans la fenêtre
 * @param windowMs Durée de la fenêtre en millisecondes
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  pruneExpired();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
