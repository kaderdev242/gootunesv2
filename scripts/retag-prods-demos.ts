/**
 * Pose le tag Gootunes sur les démos des prods déjà publiées.
 *
 *   npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/retag-prods-demos.ts          # aperçu
 *   npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/retag-prods-demos.ts --apply  # exécute
 *
 * Les démos déjà taguées (clé en « -tagged.mp3 ») sont ignorées : on peut
 * relancer le script sans doubler le tag. L'ancienne démo reste sur R2.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { watermarkDemoKey } from "@/lib/prods/watermark";

async function main() {
  const apply = process.argv.includes("--apply");
  const admin = createAdminClient();
  const { data: beats, error } = await admin
    .from("beats")
    .select("id, title, owner_id, demo_key")
    .not("demo_key", "like", "%-tagged.mp3");
  if (error) throw error;

  console.log(`${beats?.length ?? 0} démo(s) à taguer${apply ? "" : " (aperçu, ajoute --apply pour exécuter)"}`);
  let done = 0;
  for (const beat of beats ?? []) {
    if (!apply) {
      console.log(`- ${beat.title}`);
      continue;
    }
    try {
      const key = await watermarkDemoKey(beat.demo_key, beat.owner_id);
      const { error: upErr } = await admin.from("beats").update({ demo_key: key }).eq("id", beat.id);
      if (upErr) throw upErr;
      done += 1;
      console.log(`✓ ${beat.title}`);
    } catch (e) {
      console.error(`✗ ${beat.title} :`, e instanceof Error ? e.message : e);
    }
  }
  if (apply) console.log(`${done}/${beats?.length ?? 0} démo(s) taguée(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
