import { createHmac, timingSafeEqual } from "crypto";
import { mbiyoBaseUrl } from "./config";

export type MbiyoPayinRequest = {
  amount: number;
  currency: string;
  payment_method: "mobile_money";
  order_id: string;
  callback_url?: string;
  metadata: {
    network: string;
    phone_number: string;
    country_code: string;
    om_otp?: string;
  };
};

export type MbiyoPayinData = {
  transaction_id: string;
  amount: number;
  fee: number;
  charged_amount: number;
  currency: string;
  order_id: string;
  status: "pending" | "successful" | "failed" | "cancelled" | string;
  payment_method?: string;
  redirect_url?: string | null;
  instructions?: string | null;
  auth_mode?: "confirm" | "pin" | null;
  created_at?: string;
};

export type MbiyoApiResponse<T> = {
  status: string;
  message?: string;
  data: T;
};

function apiKey() {
  const key = process.env.MBIYO_API_KEY?.trim();
  if (!key) throw new Error("MBIYO_API_KEY manquante");
  return key;
}

async function mbiyoFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<MbiyoApiResponse<T>> {
  const res = await fetch(`${mbiyoBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as
    | (MbiyoApiResponse<T> & {
        data?: unknown;
      })
    | null;

  if (!res.ok || !json || json.status === "error") {
    const base =
      json?.message || `Erreur paiement (${res.status || "réseau"})`;
    const details = formatMbiyoErrorData(json?.data);
    throw new Error(details ? `${base}: ${details}` : base);
  }
  return json;
}

function formatMbiyoErrorData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      parts.push(`${key}: ${value.join(", ")}`);
    } else if (typeof value === "string") {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.length ? parts.join(" · ") : null;
}

export type MbiyoPayoutRequest = {
  amount: number;
  currency: string;
  payment_method: "mobile_money";
  order_id: string;
  callback_url: string;
  metadata: {
    network: string;
    phone_number: string;
    country_code: string;
    beneficiary: string;
  };
};

/** Collecte Mobile Money — https://dashboard.mbiyo.africa/docs/reference/merchant/payin */
export async function createMbiyoPayin(body: MbiyoPayinRequest) {
  return mbiyoFetch<MbiyoPayinData>("/api/v1/merchant/payin", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Envoi Mobile Money — https://dashboard.mbiyo.africa/docs/reference/merchant/payout */
export async function createMbiyoPayout(body: MbiyoPayoutRequest) {
  return mbiyoFetch<MbiyoPayinData>("/api/v1/merchant/payout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Statut transaction (id MBIYO ou order_id) */
export async function getMbiyoTransaction(transactionOrOrderId: string) {
  return mbiyoFetch<MbiyoPayinData>(
    `/api/v1/merchant/transactions/${encodeURIComponent(transactionOrOrderId)}`,
  );
}

export async function finalizeMbiyoPayment(
  transactionId: string,
  otp: string,
) {
  return mbiyoFetch<null>(
    `/api/v1/merchant/transactions/${encodeURIComponent(transactionId)}/finalize`,
    {
      method: "POST",
      body: JSON.stringify({ otp }),
    },
  );
}

/** Vérifie Signature HMAC-SHA256 si MBIYO_WEBHOOK_SECRET est défini */
export function verifyMbiyoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.MBIYO_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/i, "").trim();

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type MbiyoWebhookPayload = {
  transaction_id: string;
  amount: number;
  fee?: number;
  currency: string;
  order_id: string;
  status: string;
  charged_amount?: number;
  type?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
};
