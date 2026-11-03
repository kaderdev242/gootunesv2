import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_MS = 60_000;

type SessionPayload = {
  access_token: string;
  refresh_token: string;
};

function secret() {
  return (
    process.env.CREATOR_OTP_PEPPER?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

function sessionKey() {
  return createHash("sha256").update(`otp-session:${secret()}`).digest();
}

export function hashOtp(code: string) {
  return createHmac("sha256", secret() || "gootunes-otp")
    .update(code)
    .digest("hex");
}

export function otpEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function serializeSessionPayload(session: SessionPayload): Json {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sessionKey(), iv);
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  return {
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: enc.toString("base64"),
  };
}

export function parseSessionPayload(raw: Json | null): SessionPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (raw.v === 1 && typeof raw.data === "string") {
    try {
      const iv = Buffer.from(String(raw.iv), "base64");
      const tag = Buffer.from(String(raw.tag), "base64");
      const data = Buffer.from(String(raw.data), "base64");
      const decipher = createDecipheriv("aes-256-gcm", sessionKey(), iv);
      decipher.setAuthTag(tag);
      const json = Buffer.concat([decipher.update(data), decipher.final()]).toString(
        "utf8",
      );
      const parsed = JSON.parse(json) as SessionPayload;
      if (!parsed.access_token || !parsed.refresh_token) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

export async function createLoginChallenge(input: {
  userId: string;
  session: SessionPayload;
}) {
  const db = createAdminClient();
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  await db.from("creator_login_challenges").delete().eq("user_id", input.userId);
  await db
    .from("creator_login_challenges")
    .delete()
    .lt("expires_at", new Date().toISOString());

  const { data, error } = await db
    .from("creator_login_challenges")
    .insert({
      user_id: input.userId,
      code_hash: hashOtp(code),
      expires_at: expiresAt,
      attempts: 0,
      session_payload: serializeSessionPayload(input.session),
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    throw error || new Error("Impossible de créer le challenge OTP.");
  }

  return { challengeId: data.id, code, createdAt: data.created_at };
}

export async function loadChallenge(challengeId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("creator_login_challenges")
    .select("id, user_id, code_hash, expires_at, attempts, session_payload, created_at")
    .eq("id", challengeId)
    .maybeSingle();
  return data;
}

export async function incrementAttempts(challengeId: string, current: number) {
  const db = createAdminClient();
  await db
    .from("creator_login_challenges")
    .update({ attempts: current + 1 })
    .eq("id", challengeId)
    .eq("attempts", current);
}

export async function destroyChallenge(challengeId: string) {
  const db = createAdminClient();
  await db.from("creator_login_challenges").delete().eq("id", challengeId);
}

export async function latestChallengeForUser(userId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("creator_login_challenges")
    .select("id, created_at, expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
