import Link from "next/link";
import {
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Folder01Icon,
  Money01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
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
import {
  ConsoleEmpty,
  ConsoleLink,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  T,
  consoleButtonClass,
} from "@/components/admin/console/ui";

export function AdminArtistDetailView({ data }: { data: AdminArtistDetail }) {
  const { artist, owner, releases, stats } = data;
  const ownerRole = owner?.role === "label" ? ("label" as const) : ("artist" as const);

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-[13px]">
        <Link href="/goo-admin/artistes" className="text-zinc-500 transition hover:text-zinc-200">
          Artistes & labels
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-200">{artist.stage_name}</span>
      </nav>

      {/* Bandeau profil */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113]">
        <div className="absolute inset-0 opacity-40">
          <AppImage src={artist.avatar_url || FALLBACK_COVER} alt="" fill className="scale-125 object-cover blur-3xl" sizes="600px" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#111113] via-[#111113]/90 to-[#111113]/60" />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:size-28">
            <AppImage src={artist.avatar_url || FALLBACK_COVER} alt="" fill className="object-cover" sizes="112px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone="violet">Profil catalogue</Pill>
              {artist.is_verified ? <Pill tone="violet" dot>Certifié</Pill> : <Pill>Non certifié</Pill>}
              {owner?.is_suspended ? <Pill tone="danger" dot>Compte suspendu</Pill> : null}
            </div>
            <h1 className="mt-2 inline-flex items-center gap-2 text-[28px] font-semibold tracking-[-0.02em] text-white">
              {artist.stage_name}
              {artist.is_verified ? <VerifiedBadge size={20} /> : null}
            </h1>
            <p className="text-[12px] text-zinc-500">
              <span className="font-mono">{artist.public_id}</span>
              {artist.country ? ` · ${artist.country}` : ""}
            </p>
            {artist.bio ? <p className="mt-2 line-clamp-2 max-w-2xl text-[13px] text-zinc-400">{artist.bio}</p> : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <VerifyArtistButton artistId={artist.id} verified={artist.is_verified} />
            <ConsoleLink href={`/discover/artiste/${artist.public_id}`} size="sm" icon={ArrowUpRight01Icon}>
              Voir sur Discover
            </ConsoleLink>
          </div>
        </div>
      </section>

      <KpiGrid cols={4}>
        <Kpi highlight label="CA des ventes" value={formatFcfa(stats.salesFcfa)} icon={Money01Icon} />
        <Kpi label="Ventes" value={stats.salesCount} icon={ShoppingBag01Icon} />
        <Kpi label="Publications" value={stats.releasesCount} icon={Folder01Icon} />
        <Kpi
          label="Publiées"
          value={stats.publishedCount}
          sub={stats.hiddenCount > 0 ? `${stats.hiddenCount} masquée${stats.hiddenCount > 1 ? "s" : ""}` : undefined}
          icon={CheckmarkCircle02Icon}
        />
      </KpiGrid>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.7fr]">
        <Panel title="Compte propriétaire" subtitle={owner ? owner.email || undefined : "Introuvable"}>
          {owner ? (
            <div className="space-y-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                <Meta label="Nom" value={owner.display_name || "—"} />
                <Meta label="Rôle" value={owner.role} />
                <Meta label="Pays" value={owner.country || "—"} />
                <Meta label="Téléphone" value={owner.phone || "—"} />
                <Meta label="Solde" value={formatFcfa(owner.balance_fcfa)} highlight />
                <Meta label="Créé le" value={new Date(owner.created_at).toLocaleDateString("fr-FR")} />
                <Meta label="Onboarding" value={owner.onboarding_completed ? "Complété" : "Incomplet"} />
                <div>
                  <dt className="text-[11px] text-zinc-500">Statut</dt>
                  <dd className="mt-1">
                    {owner.is_suspended ? <Pill tone="danger" dot>Suspendu</Pill> : <Pill tone="ok" dot>Actif</Pill>}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-start justify-between gap-3 border-t border-white/[0.05] pt-4">
                <CreatorPlanControls
                  userId={owner.id}
                  role={ownerRole}
                  artistPlan={owner.artist_plan}
                  artistPlanExpiresAt={owner.artist_plan_expires_at}
                  labelPlan={owner.label_plan}
                  labelPlanExpiresAt={owner.label_plan_expires_at}
                />
                <SuspendUserButton userId={owner.id} suspended={owner.is_suspended} />
              </div>
            </div>
          ) : (
            <ConsoleEmpty title="Compte propriétaire introuvable" />
          )}
        </Panel>

        <Panel
          flush
          title="Publications"
          subtitle={`${releases.length} publication${releases.length > 1 ? "s" : ""}`}
        >
          <div className={T.wrap}>
            <table className={`${T.table} min-w-[640px]`}>
              <thead className={T.thead}>
                <tr>
                  <th className={T.th}>Titre</th>
                  <th className={T.th}>Statut</th>
                  <th className={`${T.th} text-right`}>Prix</th>
                  <th className={`${T.th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <ConsoleEmpty title="Aucune publication" />
                    </td>
                  </tr>
                ) : (
                  releases.map((r) => (
                    <tr key={r.id} className={T.tr}>
                      <td className={T.td}>
                        <div className="flex items-center gap-3">
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
                            <AppImage src={r.cover_url || FALLBACK_COVER} alt="" fill className="object-cover" sizes="40px" />
                          </span>
                          <div className="min-w-0">
                            <p className={`${T.strong} truncate`}>{r.title}</p>
                            <p className={`${T.sub} capitalize`}>
                              {r.type} · {r.tracksCount} titre{r.tracksCount > 1 ? "s" : ""}
                              {r.genre ? ` · ${r.genre}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={T.td}>
                        <div className="flex flex-wrap gap-1">
                          <Pill tone={r.status === "published" ? "ok" : "neutral"}>{r.status}</Pill>
                          {r.is_hidden ? <Pill tone="warn">Masquée</Pill> : null}
                        </div>
                      </td>
                      <td className={`${T.td} ${T.num} whitespace-nowrap text-right`}>{formatFcfa(r.price_fcfa)}</td>
                      <td className={T.td}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/discover/release/${r.public_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={consoleButtonClass("subtle", "sm")}
                          >
                            Voir
                          </Link>
                          <HideReleaseButton releaseId={r.id} hidden={r.is_hidden} />
                          <DeleteReleaseButton releaseId={r.id} title={r.title} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Meta({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-zinc-500">{label}</dt>
      <dd className={`mt-0.5 truncate font-medium ${highlight ? "text-violet-200" : "text-zinc-100"}`}>{value}</dd>
    </div>
  );
}
