/**
 * Régénère la démo taguée (tag Gootunes, extrait de 60 s) de chaque prod.
 *
 *   npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/retag-prods-demos.ts          # aperçu
 *   npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/retag-prods-demos.ts --apply  # exécute
 *
 * Source utilisée, dans l'ordre : la démo d'origine du beatmaker (si la clé
 * taguée permet de la retrouver), sinon le fichier de licence MP3, puis WAV.
 * Le script repart toujours d'une source sans le tag Gootunes : on peut le
 * relancer sans empiler les tags (après un changement d'intervalle, par ex.).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { headObjectFromR2 } from "@/lib/r2";
import { sourceKeyFor, watermarkDemoKey } from "@/lib/prods/watermark";

async function exists(key: string | null | undefined) {
  if (!key) return false;
  try {
    await headObjectFromR2(key);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const admin = createAdminClient();
  const { data: beats, error } = await admin
    .from("beats")
    .select("id, title, demo_key, beat_files(mp3_key, wav_key)");
  if (error) throw error;

  let done = 0;
  for (const beat of beats ?? []) {
    const files = (Array.isArray(beat.beat_files) ? beat.beat_files[0] : beat.beat_files) as
      | { mp3_key: string | null; wav_key: string | null }
      | null;
    const original = beat.demo_key.endsWith("-tagged.mp3") ? sourceKeyFor(beat.demo_key) : beat.demo_key;
    const candidates: [string, string | null | undefined][] = [
      ["démo d'origine", original],
      ["licence MP3", files?.mp3_key],
      ["licence WAV", files?.wav_key],
    ];
    let source: [string, string] | null = null;
    for (const [label, key] of candidates) {
      if (key && (await exists(key))) {
        source = [label, key];
        break;
      }
    }
    if (!source) {
      console.error(`✗ ${beat.title} : aucune source sans tag trouvée`);
      continue;
    }
    if (!apply) {
      console.log(`- ${beat.title} ← ${source[0]}`);
      continue;
    }
    try {
      const key = await watermarkDemoKey(source[1]);
      const { error: upErr } = await admin.from("beats").update({ demo_key: key }).eq("id", beat.id);
      if (upErr) throw upErr;
      done += 1;
      console.log(`✓ ${beat.title} ← ${source[0]}`);
    } catch (e) {
      console.error(`✗ ${beat.title} :`, e instanceof Error ? e.message : e);
    }
  }
  console.log(apply ? `${done}/${beats?.length ?? 0} démo(s) régénérée(s)` : "Aperçu : ajoute --apply pour exécuter");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
