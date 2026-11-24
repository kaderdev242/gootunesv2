"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl, sendEmailBatch } from "@/lib/email/client";
import { emailLayout, p } from "@/lib/email/layout";
import { pushConfigured, sendPushToTokens, type PushMessage } from "@/lib/push/fcm";
import { resendConfigured } from "@/lib/email/client";

export type Audience = "all" | "fans" | "artists" | "labels" | "creators" | "one";

const ROLES: Record<Exclude<Audience, "one">, string[] | null> = {
  all: null,
  fans: ["fan"],
  artists: ["artist"],
  labels: ["label"],
  creators: ["artist", "label"],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCREENS = new Set(["home", "revenus", "retraits", "catalogue", "profil"]);

export type BroadcastRow = {
  id: string;
  channel: "push" | "email";
  audience: string;
  target_email: string | null;
  title: string;
  body: string;
  recipients: number;
  sent: number;
  failed: number;
  is_test: boolean;
  created_at: string;
};

export type AudienceCounts = {
  email: Record<Exclude<Audience, "one">, number>;
  push: Record<Exclude<Audience, "one">, number>;
  pushReady: boolean;
  emailReady: boolean;
};

type Person = { id: string; email: string | null; role: string };

/** Comptes actifs (non suspendus) avec leur rôle. */
async function activePeople(): Promise<Person[]> {
  const db = createAdminClient();
  const out: Person[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db
      .from("profiles")
      .select("id, email, role")
      .eq("is_suspended", false)
      .range(from, from + 999);
    out.push(...((data ?? []) as Person[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Jetons d'appareils (app Gootunes Artistes) avec le rôle de leur compte. */
async function deviceTokens(people: Person[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (createAdminClient() as any).from("creator_push_tokens").select("token, user_id");
  const roleOf = new Map(people.map((p) => [p.id, p]));
  return ((data ?? []) as { token: string; user_id: string }[])
    .map((t) => ({ token: t.token, person: roleOf.get(t.user_id) }))
    .filter((t): t is { token: string; person: Person } => Boolean(t.person));
}

function inAudience(person: Person, audience: Exclude<Audience, "one">) {
  const roles = ROLES[audience];
  return !roles || roles.includes(person.role);
}

export async function getAudienceCounts(): Promise<AudienceCounts | null> {
  const admin = await requireAdmin();
  if (!admin) return null;
  const people = await activePeople();
  const tokens = await deviceTokens(people);
  const keys = Object.keys(ROLES) as Exclude<Audience, "one">[];
  const email = Object.fromEntries(
    keys.map((k) => [k, people.filter((p) => p.email && inAudience(p, k)).length]),
  ) as AudienceCounts["email"];
  const push = Object.fromEntries(
    keys.map((k) => [k, new Set(tokens.filter((t) => inAudience(t.person, k)).map((t) => t.person.id)).size]),
  ) as AudienceCounts["push"];
  return { email, push, pushReady: pushConfigured(), emailReady: resendConfigured() };
}

async function logBroadcast(row: Omit<BroadcastRow, "id" | "created_at"> & { cta_url?: string | null; actor_id: string }) {
  // Table ajoutée en migration 036 (pas encore dans database.types).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (createAdminClient() as any).from("admin_broadcasts").insert(row).then(
    () => null,
    () => null,
  );
}

export async function listBroadcasts(channel: "push" | "email"): Promise<BroadcastRow[]> {
  const admin = await requireAdmin();
  if (!admin) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (createAdminClient() as any)
    .from("admin_broadcasts")
    .select("id, channel, audience, target_email, title, body, recipients, sent, failed, is_test, created_at")
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as BroadcastRow[];
}

type Result = { error?: string; success?: string; sent?: number; failed?: number };

/** Notification push vers l'app Gootunes Artistes. `test` = uniquement mes appareils. */
export async function adminSendPush(input: {
  audience: Audience;
  email?: string;
  title: string;
  body: string;
  screen?: string;
  test?: boolean;
}): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").trim();
  if (!title || title.length > 65) return { error: "Titre obligatoire (65 caractères max)." };
  if (!body || body.length > 180) return { error: "Message obligatoire (180 caractères max)." };
  const screen = SCREENS.has(String(input.screen)) ? (input.screen as PushMessage["screen"]) : "home";
  if (!pushConfigured()) return { error: "Firebase n'est pas configuré sur le serveur (FIREBASE_SERVICE_ACCOUNT)." };

  const people = await activePeople();
  const tokens = await deviceTokens(people);
  let targets: string[];
  let audienceLabel: string = input.audience;
  let target: string | null = null;
  if (input.test) {
    targets = tokens.filter((t) => t.person.id === admin.userId).map((t) => t.token);
    audienceLabel = "test";
    if (!targets.length) return { error: "Aucun appareil inscrit sur ton compte : connecte-toi à l'app Gootunes Artistes pour tester." };
  } else if (input.audience === "one") {
    target = String(input.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(target)) return { error: "E-mail du destinataire invalide." };
    targets = tokens.filter((t) => t.person.email?.toLowerCase() === target).map((t) => t.token);
    if (!targets.length) return { error: "Ce compte n'a aucun appareil inscrit aux notifications." };
  } else if (input.audience in ROLES) {
    targets = tokens.filter((t) => inAudience(t.person, input.audience as Exclude<Audience, "one">)).map((t) => t.token);
  } else {
    return { error: "Audience invalide." };
  }
  if (!targets.length) return { error: "Aucun appareil dans cette audience." };

  const { sent, failed } = await sendPushToTokens(targets, { title, body, screen });
  await logBroadcast({
    channel: "push",
    audience: audienceLabel,
    target_email: target,
    title,
    body,
    recipients: targets.length,
    sent,
    failed,
    is_test: Boolean(input.test),
    actor_id: admin.userId,
  });
  return sent
    ? { success: `Notification envoyée à ${sent} appareil${sent > 1 ? "s" : ""}${failed ? ` (${failed} en échec)` : ""}.`, sent, failed }
    : { error: "Aucune notification n'a pu partir.", sent, failed };
}

function safeCta(url: string) {
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith("/") && !u.startsWith("//")) return appUrl(u);
  try {
    return new URL(u).protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

/** E-mail groupé (ou à un seul compte). `test` = uniquement à moi. */
export async function adminSendEmail(input: {
  audience: Audience;
  email?: string;
  subject: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  test?: boolean;
}): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  const subject = String(input.subject ?? "").trim();
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").trim();
  if (!subject || subject.length > 120) return { error: "Objet obligatoire (120 caractères max)." };
  if (!title || title.length > 120) return { error: "Titre obligatoire (120 caractères max)." };
  if (!body || body.length > 5000) return { error: "Message obligatoire (5 000 caractères max)." };
  const ctaLabel = String(input.ctaLabel ?? "").trim().slice(0, 40);
  const ctaUrl = input.ctaUrl ? safeCta(String(input.ctaUrl)) : null;
  if (input.ctaUrl?.trim() && !ctaUrl) return { error: "Lien du bouton invalide (https:// ou chemin du site)." };

  let recipients: string[];
  let audienceLabel: string = input.audience;
  let target: string | null = null;
  if (input.test) {
    if (!admin.email) return { error: "Ton compte n'a pas d'e-mail." };
    recipients = [admin.email];
    audienceLabel = "test";
  } else if (input.audience === "one") {
    target = String(input.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(target)) return { error: "E-mail du destinataire invalide." };
    recipients = [target];
  } else if (input.audience in ROLES) {
    const people = await activePeople();
    recipients = people
      .filter((p) => p.email && inAudience(p, input.audience as Exclude<Audience, "one">))
      .map((p) => p.email as string);
  } else {
    return { error: "Audience invalide." };
  }
  if (!recipients.length) return { error: "Aucun destinataire dans cette audience." };

  const paragraphs = body.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  const html = emailLayout({
    preheader: paragraphs[0]?.slice(0, 120),
    title,
    bodyHtml: [
      ...paragraphs.map((t) => p(t)),
      p("Tu reçois cet e-mail parce que tu as un compte Gootunes."),
    ].join(""),
    cta: ctaUrl ? { label: ctaLabel || "Ouvrir Gootunes", href: ctaUrl } : undefined,
  });
  const text = `${title}\n\n${paragraphs.join("\n\n")}${ctaUrl ? `\n\n${ctaLabel || "Ouvrir Gootunes"} : ${ctaUrl}` : ""}`;

  let result: { sent: number; failed: number };
  try {
    result = await sendEmailBatch(recipients, { subject, html, text });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Envoi impossible." };
  }
  await logBroadcast({
    channel: "email",
    audience: audienceLabel,
    target_email: target,
    title: subject,
    body,
    cta_url: ctaUrl,
    recipients: recipients.length,
    sent: result.sent,
    failed: result.failed,
    is_test: Boolean(input.test),
    actor_id: admin.userId,
  });
  return result.sent
    ? { success: `E-mail envoyé à ${result.sent} destinataire${result.sent > 1 ? "s" : ""}${result.failed ? ` (${result.failed} en échec)` : ""}.`, ...result }
    : { error: "Aucun e-mail n'a pu partir.", ...result };
}

/** Aperçu HTML exact de l'e-mail (pour l'iframe de l'éditeur). */
export async function previewEmailHtml(input: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): Promise<string> {
  const admin = await requireAdmin();
  if (!admin) return "";
  const paragraphs = String(input.body ?? "").split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  const ctaUrl = input.ctaUrl ? safeCta(String(input.ctaUrl)) : null;
  return emailLayout({
    title: String(input.title ?? "").trim() || "Titre de l'e-mail",
    bodyHtml: [
      ...(paragraphs.length ? paragraphs : ["Ton message apparaîtra ici."]).map((t) => p(t)),
      p("Tu reçois cet e-mail parce que tu as un compte Gootunes."),
    ].join(""),
    cta: ctaUrl ? { label: String(input.ctaLabel ?? "").trim() || "Ouvrir Gootunes", href: ctaUrl } : undefined,
  });
}
