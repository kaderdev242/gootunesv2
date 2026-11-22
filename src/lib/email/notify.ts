import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl, contactInbox, sendEmailSafe } from "./client";
import { sendPushSafe } from "@/lib/push/fcm";
import { LICENSES } from "@/lib/prods/constants";
import {
  accountReactivatedEmail,
  accountSuspendedEmail,
  beatPurchaseBuyerEmail,
  beatPurchaseSellerEmail,
  loginOtpEmail,
  planGiftedEmail,
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

    // Push vers l'app Gootunes Artistes du vendeur.
    sendPushSafe(purchase.seller_id, {
      title: "Nouvelle vente",
      body: `${title} vient d'être acheté · +${new Intl.NumberFormat("fr-FR").format(Number(purchase.artist_net_fcfa) || 0)} FCFA`,
      screen: "revenus",
    });

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

export function notifyLoginOtp(input: {
  email: string;
  displayName?: string | null;
  code: string;
}) {
  const mail = loginOtpEmail(input);
  sendEmailSafe({
    to: input.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
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

/** Mails acheteur + vendeur après l'achat d'une licence de prod. */
export async function notifyBeatOrderCompleted(orderId: string) {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("beat_orders")
      .select("id, status, license, amount_fcfa, artist_net_fcfa, buyer_id, seller_id, beat_id, beats(title, artists(stage_name))")
      .eq("id", orderId)
      .maybeSingle();
    if (!order || order.status !== "completed") return;

    const beat = (Array.isArray(order.beats) ? order.beats[0] : order.beats) as {
      title: string;
      artists: { stage_name: string } | { stage_name: string }[] | null;
    } | null;
    const artist = Array.isArray(beat?.artists) ? beat?.artists[0] : beat?.artists;
    const [{ data: buyer }, { data: seller }, { data: files }] = await Promise.all([
      admin.from("profiles").select("email, display_name").eq("id", order.buyer_id).maybeSingle(),
      admin.from("profiles").select("email, display_name, role").eq("id", order.seller_id).maybeSingle(),
      admin.from("beat_files").select("mp3_key, wav_key, stems_key").eq("beat_id", order.beat_id).maybeSingle(),
    ]);
    const license = LICENSES[order.license];
    const labels = { mp3: "MP3", wav: "WAV", stems: "Stems (ZIP)" } as const;
    const provided = license.files.filter((f) => files?.[`${f}_key` as const]).map((f) => labels[f]);
    const title = beat?.title || "Prod";

    sendPushSafe(order.seller_id, {
      title: "Nouvelle vente de prod",
      body: `${title} · +${new Intl.NumberFormat("fr-FR").format(Number(order.artist_net_fcfa) || 0)} FCFA`,
      screen: "revenus",
    });

    if (buyer?.email) {
      const mail = beatPurchaseBuyerEmail({
        buyerName: buyer.display_name,
        title,
        beatmaker: artist?.stage_name || "Beatmaker",
        licenseName: license.name,
        amountFcfa: Number(order.amount_fcfa),
        files: provided,
        downloadsUrl: appUrl("/prods/achats"),
      });
      sendEmailSafe({ to: buyer.email, subject: mail.subject, html: mail.html, text: mail.text });
    }
    if (seller?.email) {
      const mail = beatPurchaseSellerEmail({
        sellerName: seller.display_name,
        title,
        licenseName: license.name,
        amountFcfa: Number(order.amount_fcfa),
        netFcfa: Number(order.artist_net_fcfa),
        dashboardPath: seller.role === "label" ? "/label/publications" : "/artist/publications",
      });
      sendEmailSafe({ to: seller.email, subject: mail.subject, html: mail.html, text: mail.text });
    }
  } catch (e) {
    console.error("[email] notifyBeatOrderCompleted", e);
  }
}

/** Abonnement artiste ou label offert par l'admin. */
export function notifyPlanGifted(input: {
  userId?: string;
  email: string;
  displayName?: string | null;
  kind: "artist" | "label";
  planName: string;
  years: number;
  expiresAt: Date;
}) {
  const mail = planGiftedEmail(input);
  if (input.userId) {
    sendPushSafe(input.userId, {
      title: "Félicitations",
      body: `Gootunes t'offre ${input.years > 1 ? `${input.years} ans` : "1 an"} d'abonnement ${input.planName}`,
      screen: "profil",
    });
  }
  sendEmailSafe({
    to: input.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}
