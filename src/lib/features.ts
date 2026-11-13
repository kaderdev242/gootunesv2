import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fonctionnalités exclusives activables depuis la console admin.
 * Pour en ajouter une : une entrée ici + une ligne dans `feature_flags` (migration).
 */
export const FEATURES = {
  retro: {
    name: "Rétro",
    description:
      "Récap personnalisé des écoutes, ventes et revenus, en cartes à télécharger, aux couleurs de la photo de profil.",
    audience: "Artistes et labels",
    paths: ["/artist", "/label"],
  },
} as const;

export type FeatureKey = keyof typeof FEATURES;

export type FeatureState = {
  key: FeatureKey;
  enabled: boolean;
  updatedAt: string | null;
};

function isFeatureKey(key: string): key is FeatureKey {
  return Object.prototype.hasOwnProperty.call(FEATURES, key);
}

/** État de toutes les fonctionnalités (désactivées si la ligne ou la table manque). */
export const getFeatureStates = cache(async (): Promise<FeatureState[]> => {
  const states = new Map<FeatureKey, FeatureState>();
  for (const key of Object.keys(FEATURES) as FeatureKey[]) {
    states.set(key, { key, enabled: false, updatedAt: null });
  }
  try {
    const db = createAdminClient();
    const { data } = await db.from("feature_flags").select("key, enabled, updated_at");
    for (const row of data ?? []) {
      if (isFeatureKey(row.key)) {
        states.set(row.key, { key: row.key, enabled: row.enabled, updatedAt: row.updated_at });
      }
    }
  } catch {
    // Pas de clé service ou table absente : tout reste désactivé
  }
  return [...states.values()];
});

export async function isFeatureEnabled(key: FeatureKey) {
  const states = await getFeatureStates();
  return states.find((s) => s.key === key)?.enabled ?? false;
}

export async function getEnabledFeatures(): Promise<FeatureKey[]> {
  const states = await getFeatureStates();
  return states.filter((s) => s.enabled).map((s) => s.key);
}

export { isFeatureKey };
