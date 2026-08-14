"use server";

import { contactInbox, sendEmail } from "@/lib/email/client";
import { contactAckEmail, contactLeadEmail } from "@/lib/email/templates";
import { logServerError, toUserError, USER_ERRORS } from "@/lib/errors";
import type { ActionState } from "./profile";

export type ContactIntent = "call" | "contact";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitContactLead(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const intentRaw = String(formData.get("intent") || "contact");
  const intent: ContactIntent = intentRaw === "call" ? "call" : "contact";
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const company = String(formData.get("company") || "").trim();
  const message = String(formData.get("message") || "").trim();
  // Honeypot anti-spam
  const website = String(formData.get("website") || "").trim();

  if (website) {
    return { success: "Message envoyé. On te répond bientôt." };
  }

  if (!name || name.length < 2) {
    return { error: "Indique ton nom (2 caractères minimum)." };
  }
  if (!email || !isValidEmail(email)) {
    return { error: "Email invalide." };
  }
  if (!message || message.length < 10) {
    return { error: "Message trop court (10 caractères minimum)." };
  }
  if (message.length > 4000) {
    return { error: "Message trop long." };
  }

  const inbox = contactInbox();
  const lead = contactLeadEmail({
    intent,
    name,
    email,
    company: company || null,
    message,
  });

  const result = await sendEmail({
    to: inbox,
    subject: lead.subject,
    html: lead.html,
    text: lead.text,
    replyTo: email,
  });

  if (!result.ok) {
    if ("skipped" in result && result.skipped) {
      logServerError("contact.lead", "RESEND_API_KEY absente");
      return {
        error:
          "Envoi indisponible pour le moment. Écris-nous à gootunes242@gmail.com.",
      };
    }
    logServerError("contact.lead", "error" in result ? result.error : result);
    return { error: toUserError(USER_ERRORS.generic) };
  }

  // Accusé de réception (best effort)
  const ack = contactAckEmail({ name });
  void sendEmail({
    to: email,
    subject: ack.subject,
    html: ack.html,
    text: ack.text,
  });

  return {
    success:
      intent === "call"
        ? "Demande d'appel envoyée. On te recontacte bientôt."
        : "Message envoyé. On te répond bientôt.",
  };
}
