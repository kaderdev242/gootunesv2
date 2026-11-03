"use client";

type Payload = {
  source: string;
  message: string;
  stack?: string | null;
  path?: string | null;
  digest?: string | null;
  context?: Record<string, unknown>;
};

const recent = new Map<string, number>();

function fingerprint(p: Payload) {
  return `${p.source}|${p.path || ""}|${p.message.slice(0, 180)}`;
}

export function reportClientError(payload: Payload) {
  const key = fingerprint(payload);
  const now = Date.now();
  const last = recent.get(key) || 0;
  if (now - last < 20_000) return;
  recent.set(key, now);

  const body = JSON.stringify({
    source: payload.source,
    message: payload.message.slice(0, 2000),
    stack: payload.stack?.slice(0, 8000) || null,
    path: payload.path || (typeof window !== "undefined" ? window.location.pathname : null),
    digest: payload.digest || null,
    context: payload.context || {},
  });

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/system-log", blob)) return;
    }
  } catch {
    /* fetch fallback */
  }

  void fetch("/api/system-log", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
