import { createAdminClient } from "@/lib/supabase/admin";
import { contactInbox, sendEmailSafe } from "./client";
import {
  accountReactivatedEmail,
  accountSuspendedEmail,
  labelArtistCreatedEmail,
  purchaseBuyerEmail,
  purchaseSellerEmail,
  releasePublishedEmail,
  welcomeEmail,
} from "./templates";

export function notifyWelcome(input: {
  email: string;
  displayName?: string | null;
  role: string;
}) {
  const mail = welcomeEmail(input);
  sendEmailSafe({
    to: input.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

export function notifyReleasePublished(input: {
  email: string;
  title: string;
  type: "single" | "album";
  artistName: string;
  priceFcfa: number;
  releaseId: string;
}) {
  const mail = releasePublishedEmail(input);
  sendEmailSafe({
    to: input.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

export function notifyLabelArtistCreated(input: {
  email: string;
  stageName: string;
  country: string;
  labelName?: string | null;
}) {
  const mail = labelArtistCreatedEmail(input);
  sendEmailSafe({
    to: input.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

/** Envoie les mails acheteur + vendeur après un achat complété. */
export async function notifyPurchaseCompleted(purchaseId: string) {
  try {
    const admin = createAdminClient();
    const { data: purchase } = await admin
      .from("purchases")
      .select(
        "id, amount_fcfa, artist_net_fcfa, buyer_id, seller_id, release_id, status",
      )
      .eq("id", purchaseId)
      .maybeSingle();

    if (!purchase || purchase.status !== "completed") return;

    const [{ data: buyer }, { data: seller }, { data: release }] =
      await Promise.all([
        admin
          .from("profiles")
          .select("email, display_name")
          .eq("id", purchase.buyer_id)
          .maybeSingle(),
        admin
          .from("profiles")
          .select("email, display_name, role")
          .eq("id", purchase.seller_id)
          .maybeSingle(),
        admin
          .from("releases")
          .select("id, public_id, title, artists(stage_name)")
          .eq("id", purchase.release_id)
          .maybeSingle(),
      ]);

    if (!release) return;

    const artistRel = release.artists as
      | { stage_name: string }
      | { stage_name: string }[]
      | null;
    const artistName = Array.isArray(artistRel)
      ? artistRel[0]?.stage_name
      : artistRel?.stage_name;
    const title = release.title;
    const artist = artistName || "Artiste";
    const releasePathId = release.public_id || release.id;

    if (buyer?.email) {
      const mail = purchaseBuyerEmail({
        buyerName: buyer.display_name,
        title,
        artistName: artist,
        amountFcfa: Number(purchase.amount_fcfa),
        releaseId: releasePathId,
      });
      sendEmailSafe({
        to: buyer.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    }

    if (seller?.email) {
      const mail = purchaseSellerEmail({
        sellerName: seller.display_name,
        title,
        artistName: artist,
        buyerName: buyer?.display_name,
        amountFcfa: Number(purchase.amount_fcfa),
        netFcfa: Number(purchase.artist_net_fcfa),
        releaseId: releasePathId,
        dashboardPath: seller.role === "label" ? "/label" : "/artist",
      });
      sendEmailSafe({
        to: seller.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    }
  } catch (e) {
    console.error("[email] notifyPurchaseCompleted", e);
  }
}

export function notifyAccountSuspended(input: {
  email: string;
  displayName?: string | null;
}) {
  const mail = accountSuspendedEmail({
    displayName: input.displayName,
    supportEmail: contactInbox(),
  });
  sendEmailSafe({
    to: input.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

export function notifyAccountReactivated(input: {
  email: string;
  displayName?: string | null;
  role: string;
}) {
  const mail = accountReactivatedEmail(input);
  sendEmailSafe({
    to: input.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}
