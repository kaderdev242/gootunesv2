import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { LabelArtistForm } from "@/components/dashboard/LabelArtistForm";
import { LABEL_PLANS } from "@/lib/constants";

export default async function ArtistesPage() {
  const session = await requireCreatorProfile();
  if (!session) redirect("/connexion");
  if (session.profile.role !== "label") redirect("/label");

  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .eq("label_id", session.userId)
    .order("created_at", { ascending: false });

  const plan = session.profile.label_plan;
  const max =
    plan === "starter"
      ? LABEL_PLANS.starter.maxArtists
      : plan === "unlimited"
        ? "∞"
        : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-[34px]">Artistes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Plan {plan} · {artists?.length ?? 0}/{max} artistes
      </p>

      {plan === "none" ? (
        <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-amber-400/25 bg-amber-400/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            Active un abonnement label pour ajouter des artistes.
          </p>
          <Link
            href="/label/abonnement"
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-4 text-sm font-semibold text-white"
          >
            Abonnement Label
          </Link>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <LabelArtistForm />
        <div className="flex flex-col gap-2">
          {(artists ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun artiste rattaché.</p>
          ) : (
            artists!.map((a) => (
              <Link
                key={a.id}
                href={`/label/artistes/${a.id}`}
                className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-white px-4 py-3 transition hover:border-black/10 hover:bg-zinc-100"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-black/[0.07] bg-zinc-100">
                  {a.avatar_url ? (
                    <AppImage
                      src={a.avatar_url}
                      alt={a.stage_name}
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-sm text-zinc-500">
                      {a.stage_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-950">{a.stage_name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {a.country || "—"} · {a.bio || "Pas de bio"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">Stats →</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
