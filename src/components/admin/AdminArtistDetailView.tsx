import Link from "next/link";
import { AppImage } from "@/components/media/AppImage";
import { VerifiedBadge } from "@/components/discover/VerifiedBadge";
import {
  CreatorPlanControls,
  DeleteReleaseButton,
  HideReleaseButton,
  SuspendUserButton,
  VerifyArtistButton,
} from "@/components/admin/AdminActionForms";
import { formatFcfa } from "@/lib/format";
import { FALLBACK_COVER } from "@/lib/types/music";
import type { AdminArtistDetail } from "@/lib/admin/queries";

export function AdminArtistDetailView({ data }: { data: AdminArtistDetail }) {
  const { artist, owner, releases, stats } = data;
  const ownerRole =
    owner?.role === "label" ? ("label" as const) : ("artist" as const);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/goo-admin/artistes"
          className="text-zinc-500 transition hover:text-zinc-900"
        >
          ← Artistes
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="font-medium text-zinc-900">{artist.stage_name}</span>
      </div>

      <header className="flex flex-col gap-5 rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 sm:flex-row sm:items-start sm:p-7">
        <div className="relative mx-auto size-28 shrink-0 overflow-hidden rounded-full bg-zinc-100 sm:mx-0 sm:size-32">
          <AppImage
            src={artist.avatar_url || FALLBACK_COVER}
            alt=""
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">
            Profil catalogue
          </p>
          <h1 className="mt-1 inline-flex items-center justify-center gap-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:justify-start">
            {artist.stage_name}
            {artist.is_verified ? <VerifiedBadge size={20} /> : null}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {artist.public_id}
            {artist.country ? ` · ${artist.country}` : ""}
          </p>
          {artist.bio ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
              {artist.bio}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <VerifyArtistButton
              artistId={artist.id}
              verified={artist.is_verified}
            />
            <Link
              href={`/discover/artiste/${artist.public_id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
            >
              Voir sur Discover
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Publications" value={String(stats.releasesCount)} />
        <StatCard label="Publiées" value={String(stats.publishedCount)} />
        <StatCard label="Ventes" value={String(stats.salesCount)} />
        <StatCard label="CA ventes" value={formatFcfa(stats.salesFcfa)} />
      </div>

      {owner ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            Compte propriétaire
          </h2>
          <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
            <div className="grid gap-4 border-b border-zinc-100 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <Meta
                label="Nom"
                value={owner.display_name || "—"}
              />
              <Meta label="Email" value={owner.email || "—"} />
              <Meta label="Rôle" value={owner.role} />
              <Meta label="Pays" value={owner.country || "—"} />
              <Meta label="Téléphone" value={owner.phone || "—"} />
              <Meta
                label="Solde"
                value={formatFcfa(owner.balance_fcfa)}
              />
              <Meta
                label="Onboarding"
                value={owner.onboarding_completed ? "Complété" : "Incomplet"}
              />
              <Meta
                label="Créé le"
                value={new Date(owner.created_at).toLocaleDateString("fr-FR")}
              />
              <div>
                <p className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                  Statut
                </p>
                <div className="mt-1">
                  {owner.is_suspended ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      Suspendu
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Actif
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-4 p-5">
              <CreatorPlanControls
                userId={owner.id}
                role={ownerRole}
                artistPlan={owner.artist_plan}
                artistPlanExpiresAt={owner.artist_plan_expires_at}
                labelPlan={owner.label_plan}
                labelPlanExpiresAt={owner.label_plan_expires_at}
              />
              <SuspendUserButton
                userId={owner.id}
                suspended={owner.is_suspended}
              />
            </div>
          </div>
        </section>
      ) : (
        <p className="text-sm text-zinc-500">
          Compte propriétaire introuvable.
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Publications
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {releases.length} publication
              {releases.length > 1 ? "s" : ""}
              {stats.hiddenCount > 0
                ? ` · ${stats.hiddenCount} masquée${stats.hiddenCount > 1 ? "s" : ""}`
                : ""}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Titre</th>
                  <th className="px-5 py-3.5 font-medium">Type</th>
                  <th className="px-5 py-3.5 font-medium">Statut</th>
                  <th className="px-5 py-3.5 font-medium">Prix</th>
                  <th className="px-5 py-3.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-zinc-400"
                    >
                      Aucune publication.
                    </td>
                  </tr>
                ) : (
                  releases.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                            <AppImage
                              src={r.cover_url || FALLBACK_COVER}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900">
                              {r.title}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {r.tracksCount} titre
                              {r.tracksCount > 1 ? "s" : ""}
                              {r.genre ? ` · ${r.genre}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 capitalize text-zinc-600">
                        {r.type}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700">
                            {r.status}
                          </span>
                          {r.is_hidden ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                              Masqué
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-zinc-700">
                        {formatFcfa(r.price_fcfa)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/discover/release/${r.public_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
                          >
                            Voir
                          </Link>
                          <HideReleaseButton
                            releaseId={r.id}
                            hidden={r.is_hidden}
                          />
                          <DeleteReleaseButton
                            releaseId={r.id}
                            title={r.title}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-zinc-200/80 bg-white px-5 py-4 shadow-sm shadow-zinc-900/5">
      <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}
