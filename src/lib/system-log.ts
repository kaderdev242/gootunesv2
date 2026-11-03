import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

const MAX_MSG = 2000;
const MAX_STACK = 8000;

export type SystemLogInput = {
  level?: "error" | "warn" | "info";
  source: string;
  message: string;
  stack?: string | null;
  path?: string | null;
  digest?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  context?: Record<string, unknown>;
};

function clip(value: string | null | undefined, max: number) {
  if (!value) return null;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function toJson(value: Record<string, unknown> | undefined): Json {
  if (!value) return {};
  try {
    return JSON.parse(JSON.stringify(value)) as Json;
  } catch {
    return {};
  }
}

/** Persistance fire-and-forget — n’échoue jamais l’appelant. */
export async function persistSystemLog(input: SystemLogInput): Promise<void> {
  const message = clip(input.message.trim(), MAX_MSG);
  if (!message) return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  try {
    const db = createAdminClient();
    await db.from("system_logs").insert({
      level: input.level || "error",
      source: clip(input.source, 80) || "server",
      message,
      stack: clip(input.stack, MAX_STACK),
      path: clip(input.path, 400),
      digest: clip(input.digest, 120),
      user_agent: clip(input.userAgent, 400),
      user_id: input.userId || null,
      context: toJson(input.context),
    });
  } catch {
    // Ne pas recréer une boucle d’erreurs
  }
}

export function errText(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.name;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Erreur inconnue";
  }
}

export function errStack(err: unknown): string | null {
  if (err instanceof Error && err.stack) return err.stack;
  return null;
}
