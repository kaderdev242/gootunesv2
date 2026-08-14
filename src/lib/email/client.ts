import { Resend } from "resend";

let client: Resend | null = null;

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getResend() {
  if (!client) {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error("RESEND_API_KEY manquante");
    client = new Resend(key);
  }
  return client;
}

export function emailFrom() {
  return (
    process.env.RESEND_FROM?.trim() ||
    "Gootunes <onboarding@resend.dev>"
  );
}

/** Boîte de réception des contacts / sponsoring. */
export function contactInbox() {
  return (
    process.env.CONTACT_EMAIL?.trim() ||
    "gootunes242@gmail.com"
  );
}

export function appUrl(path = "") {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
}) {
  if (!resendConfigured()) {
    console.info("[email] RESEND_API_KEY absente — skip:", options.subject);
    return { ok: false as const, skipped: true as const };
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];
  const recipients = to.map((e) => e.trim()).filter(Boolean);
  if (!recipients.length) {
    return { ok: false as const, skipped: true as const };
  }

  try {
    const { error } = await getResend().emails.send({
      from: emailFrom(),
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });
    if (error) {
      console.error("[email]", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  } catch (e) {
    console.error("[email]", e);
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Erreur email",
    };
  }
}

/** Envoi non bloquant — n'interrompt jamais le flux métier. */
export function sendEmailSafe(
  options: Parameters<typeof sendEmail>[0],
): void {
  void sendEmail(options).catch((e) => console.error("[email]", e));
}
