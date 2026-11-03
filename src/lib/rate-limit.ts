/**
 * Rate limiter partagé via Upstash Redis (multi-instance Vercel).
 * Fallback in-memory uniquement hors production (dev local).
 * En production sans UPSTASH_* → refuse (fail-closed) pour l’auth ;
 * pour le stream on log + fallback mémoire (dégradé).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Entry = { count: number; resetAt: number };

const memoryStore = new Map<string, Entry>();

function pruneExpired(): void {
  if (memoryStore.size < 5_000) return;
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  pruneExpired();
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

function upstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!upstashConfigured()) return null;
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    const redis = Redis.fromEnv();
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "gootunes:rl",
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * @param key      Identifiant unique (ex. `"auth:signIn:1.2.3.4"`)
 * @param limit    Max requêtes dans la fenêtre
 * @param windowMs Fenêtre en ms
 * @param opts.strict Si true et pas d’Upstash en prod → refuse tout
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  opts?: { strict?: boolean },
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);

  if (limiter) {
    const res = await limiter.limit(key);
    return {
      allowed: res.success,
      remaining: res.remaining,
      resetAt: res.reset,
    };
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN manquants — rate limit non partagé",
    );
    if (opts?.strict) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + windowMs,
      };
    }
  }

  return memoryLimit(key, limit, windowMs);
}

/** Helper IP depuis headers Request / NextRequest. */
export function clientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "anonymous"
  );
}
