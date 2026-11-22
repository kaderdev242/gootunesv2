import { createSign } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerError } from "@/lib/errors";

/**
 * Envoi de notifications push via Firebase Cloud Messaging (API HTTP v1).
 *
 * Configuration : FIREBASE_SERVICE_ACCOUNT = JSON du compte de service
 * Firebase (texte brut ou base64). Sans cette variable, rien n'est envoyé.
 */

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

let cachedAccount: ServiceAccount | null | undefined;
let cachedToken: { value: string; expiresAt: number } | null = null;

function serviceAccount(): ServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return (cachedAccount = null);
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return (cachedAccount = null);
    }
    return (cachedAccount = parsed);
  } catch (e) {
    logServerError("push.serviceAccount", e);
    return (cachedAccount = null);
  }
}

export function pushConfigured() {
  return serviceAccount() !== null;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

/** Jeton OAuth Google (JWT signé RS256), mis en cache ~55 minutes. */
async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.value;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(sa.private_key).toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`OAuth Google ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: now + (data.expires_in || 3600) };
  return data.access_token;
}

export type PushMessage = {
  title: string;
  body: string;
  /** Écran à ouvrir dans l'app (home, revenus, retraits, catalogue). */
  screen?: "home" | "revenus" | "retraits" | "catalogue" | "profil";
};

/** Envoie une notification à tous les appareils d'un compte. Ne lève jamais. */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<void> {
  const sa = serviceAccount();
  if (!sa) return;
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (admin as any)
      .from("creator_push_tokens")
      .select("token")
      .eq("user_id", userId);
    const tokens = ((rows ?? []) as { token: string }[]).map((r) => r.token);
    if (!tokens.length) return;

    const auth = await accessToken(sa);
    const stale: string[] = [];

    await Promise.all(
      tokens.map(async (token) => {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              message: {
                token,
                notification: { title: message.title, body: message.body },
                data: { screen: message.screen ?? "home" },
                apns: { payload: { aps: { sound: "default" } } },
                android: { priority: "high", notification: { sound: "default" } },
              },
            }),
          },
        );
        if (res.ok) return;
        const text = await res.text().catch(() => "");
        if (res.status === 404 || text.includes("UNREGISTERED") || text.includes("INVALID_ARGUMENT")) {
          stale.push(token);
        } else {
          logServerError("push.send", new Error(`FCM ${res.status}: ${text.slice(0, 200)}`));
        }
      }),
    );

    if (stale.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("creator_push_tokens").delete().in("token", stale);
    }
  } catch (e) {
    logServerError("push.sendToUser", e);
  }
}

/** Version non bloquante, pour les flux métier (paiement, retrait). */
export function sendPushSafe(userId: string, message: PushMessage): void {
  void sendPushToUser(userId, message);
}
