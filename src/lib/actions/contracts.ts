"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/get-profile";
import { readSignatureForm, recordContractSignature } from "@/lib/contracts/server";
import { logServerError } from "@/lib/errors";
import type { ActionState } from "./profile";

/** Signature depuis le dashboard (créateurs inscrits avant le contrat, ou nouvelle version). */
export async function signCreatorContract(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSessionProfile();
  const profile = session?.profile;
  if (!session || !profile || (profile.role !== "artist" && profile.role !== "label")) {
    return { error: "Réservé aux comptes artiste et label." };
  }

  const signature = readSignatureForm(formData);
  if (signature.error) return { error: signature.error };

  const res = await recordContractSignature({
    userId: session.userId,
    role: profile.role,
    party: {
      legalName: signature.legalName,
      displayName: profile.display_name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      country: profile.country ?? "",
      city: signature.city,
    },
    signaturePng: signature.signaturePng,
  });
  if (res.error) {
    logServerError("contracts.sign", new Error(res.error));
    return { error: res.error };
  }

  revalidatePath(`/${profile.role}/contrat`);
  revalidatePath("/goo-admin/contrats");
  return { success: "Contrat signé. Tu peux le télécharger à tout moment." };
}
