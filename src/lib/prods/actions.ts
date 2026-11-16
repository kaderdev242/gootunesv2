"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/actions/profile";
import { hasActiveArtistPlan } from "@/lib/artist-plan";
import { logServerError, mapDbError } from "@/lib/errors";
import { isFeatureEnabled } from "@/lib/features";
import {
  MAX_BEAT_PRICE_FCFA,
  MIN_BEAT_PRICE_FCFA,
} from "@/lib/prods/constants";
import { runCheckBeatOrderStatus, runInitiateBeatPurchase } from "@/lib/prods/purchase";
import { headObjectFromR2 } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { BeatLicense, PaymentMethod } from "@/lib/supabase/database.types";

function revalidateProds() {
  revalidatePath("/prods", "layout");
  revalidatePath("/artist/publications");
  revalidatePath("/label/publications");
}

const optPrice = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z
    .number()
    .int()
    .min(MIN_BEAT_PRICE_FCFA, `Prix minimum : ${MIN_BEAT_PRICE_FCFA} FCFA.`)
    .max(MAX_BEAT_PRICE_FCFA)
    .nullable(),
);
const optKey = z.preprocess((v) => (v ? String(v) : null), z.string().max(300).nullable());

const beatSchema = z.object({
  title: z.string().trim().min(1, "Titre obligatoire.").max(120),
  artist_id: z.string().uuid("Artiste obligatoire."),
  cover_url: z.string().trim().min(1, "Cover obligatoire."),
  genre: z.string().trim().max(60).optional(),
  mood: z.string().trim().max(40).optional(),
  bpm: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(40, "BPM entre 40 et 300.").max(300, "BPM entre 40 et 300.").nullable(),
  ),
  musical_key: z.string().trim().max(12).optional(),
  tags: z.string().max(300).optional(),
  demo_key: z.string().min(1, "Démo taguée obligatoire."),
  duration_seconds: z.preprocess((v) => (v ? Number(v) : null), z.number().int().positive().nullable()),
  mp3_key: optKey,
  wav_key: optKey,
  stems_key: optKey,
  price_mp3_fcfa: optPrice,
  price_wav_fcfa: optPrice,
  price_stems_fcfa: optPrice,
  producteur: z.string().trim().max(120).optional(),
  ownership_certified: z.literal("true", {
    error: "Certifie être l'auteur et le propriétaire de la prod.",
  }),
});

/** Publie une prod (instrumental). Écriture via service role après contrôles. */
export async function createBeat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isFeatureEnabled("prods"))) return { error: "Fonctionnalité indisponible." };

  const parsed = beatSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Champs invalides." };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, artist_plan, artist_plan_expires_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "artist" && profile?.role !== "label") {
    return { error: "Réservé aux créateurs." };
  }
  if (profile.role === "artist" && !hasActiveArtistPlan(profile)) {
    return {
      error: "Abonnement artiste requis pour publier.",
      actionHref: "/artist/abonnement",
      actionLabel: "Activer l'abonnement",
    };
  }

  const { data: artist } = await supabase
    .from("artists")
    .select("id, owner_id, label_id")
    .eq("id", input.artist_id)
    .maybeSingle();
  if (!artist || (artist.owner_id !== user.id && artist.label_id !== user.id)) {
    return { error: "Artiste non autorisé." };
  }

  // Chaque licence vendue doit avoir son fichier, et inversement.
  const pairs: [BeatLicense, number | null, string | null][] = [
    ["mp3", input.price_mp3_fcfa, input.mp3_key],
    ["wav", input.price_wav_fcfa, input.wav_key],
    ["stems", input.price_stems_fcfa, input.stems_key],
  ];
  if (!pairs.some(([, price]) => price !== null)) {
    return { error: "Active au moins une licence (MP3, WAV ou stems) avec un prix." };
  }
  for (const [lic, price, key] of pairs) {
    if (price !== null && !key) {
      const label = lic === "stems" ? "le ZIP des stems" : `le fichier ${lic.toUpperCase()} sans tag`;
      return { error: `Ajoute ${label} pour vendre cette licence.` };
    }
  }

  // Les clés doivent appartenir à l'utilisateur et exister réellement sur R2.
  const prefix = `audios/${user.id}/prods/`;
  const keys = [input.demo_key, input.mp3_key, input.wav_key, input.stems_key].filter(
    (k): k is string => Boolean(k),
  );
  for (const key of keys) {
    if (!key.startsWith(prefix) || key.includes("..")) return { error: "Fichier non autorisé." };
  }
  try {
    await Promise.all(keys.map((k) => headObjectFromR2(k)));
  } catch {
    return { error: "Un fichier n'a pas fini d'être envoyé. Réessaie l'envoi." };
  }

  const tags = (input.tags || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  const admin = createAdminClient();
  const { data: beat, error } = await admin
    .from("beats")
    .insert({
      artist_id: input.artist_id,
      owner_id: user.id,
      title: input.title,
      cover_url: input.cover_url,
      genre: input.genre || null,
      mood: input.mood || null,
      bpm: input.bpm,
      musical_key: input.musical_key || null,
      tags,
      demo_key: input.demo_key,
      duration_seconds: input.duration_seconds,
      price_mp3_fcfa: input.price_mp3_fcfa,
      price_wav_fcfa: input.price_wav_fcfa,
      price_stems_fcfa: input.price_stems_fcfa,
      credits: { producteur: input.producteur || "" },
      status: "published",
    })
    .select("id")
    .single();

  if (error || !beat) {
    logServerError("prods.createBeat", error);
    return { error: mapDbError(error, "Impossible de publier la prod.") };
  }

  const { error: filesErr } = await admin.from("beat_files").insert({
    beat_id: beat.id,
    mp3_key: input.mp3_key,
    wav_key: input.wav_key,
    stems_key: input.stems_key,
  });
  if (filesErr) {
    logServerError("prods.createBeat.files", filesErr);
    await admin.from("beats").delete().eq("id", beat.id);
    return { error: "Impossible d'enregistrer les fichiers de la prod." };
  }

  revalidateProds();
  redirect(profile.role === "label" ? "/label/publications" : "/artist/publications");
}

export async function deleteBeat(beatId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const admin = createAdminClient();
  const { data: beat } = await admin
    .from("beats")
    .select("id, owner_id")
    .eq("id", beatId)
    .maybeSingle();
  if (!beat || beat.owner_id !== user.id) return { error: "Prod introuvable." };

  // Une prod déjà vendue est masquée (les acheteurs gardent leur téléchargement).
  const { count } = await admin
    .from("beat_orders")
    .select("id", { count: "exact", head: true })
    .eq("beat_id", beatId)
    .eq("status", "completed");

  const { error } = count
    ? await admin.from("beats").update({ is_hidden: true, updated_at: new Date().toISOString() }).eq("id", beatId)
    : await admin.from("beats").delete().eq("id", beatId);
  if (error) {
    logServerError("prods.deleteBeat", error);
    return { error: "Impossible de supprimer la prod." };
  }
  revalidateProds();
  return { success: count ? "Prod retirée de la vitrine (déjà vendue)." : "Prod supprimée." };
}

export async function initiateBeatPurchase(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isFeatureEnabled("prods"))) return { error: "Fonctionnalité indisponible." };
  const supabase = await createClient();
  return runInitiateBeatPurchase(supabase, {
    beatId: String(formData.get("beat_id") || ""),
    license: String(formData.get("license") || ""),
    paymentMethod: String(formData.get("payment_method") || "") as PaymentMethod,
    phoneRaw: String(formData.get("phone") || "").trim(),
    omOtp: String(formData.get("om_otp") || "").trim(),
  });
}

export async function checkBeatPurchaseStatus(orderId: string) {
  const supabase = await createClient();
  return runCheckBeatOrderStatus(supabase, orderId);
}
