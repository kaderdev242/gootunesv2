import Link from "next/link";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Flag01Icon,
} from "@hugeicons/core-free-icons";
import { listReportsAdmin } from "@/lib/admin/queries";
import { ReportReviewForm } from "@/components/admin/AdminActionForms";
import { AppImage } from "@/components/media/AppImage";
import {
  ConsoleEmpty,
  ConsoleHeader,
  Kpi,
  KpiGrid,
  Panel,
  Pill,
  SegmentedLinks,
  type PillTone,
} from "@/components/admin/console/ui";

const REASON_LABELS: Record<string, string> = {
  copyright: "Droit d'auteur",
  illegal: "Illégal",
  spam: "Spam",
  hate: "Haine",
  other: "Autre",
};

const STATUS: Record<string, { label: string; tone: PillTone }> = {
  open: { label: "Ouvert", tone: "danger" },
  reviewing: { label: "En revue", tone: "warn" },
  resolved: { label: "Résolu", tone: "ok" },
  dismissed: { label: "Rejeté", tone: "neutral" },
};

type ReleaseLite = { id: string; title: string; is_hidden: boolean; cover_url: string | null };
type TrackLite = { id: string; title: string; release_id: string; releases: ReleaseLite | ReleaseLite[] | null };
type ReporterLite = { display_name: string | null; email: string | null };

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export default async function AdminSignalementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status === "open" || sp.status === "reviewing" || sp.status === "resolved" || sp.status === "dismissed"
      ? sp.status
      : "all";

  const all = await listReportsAdmin("all", 200);
  const count = (s: string) => all.filter((r) => r.status === s).length;
  const reports = status === "all" ? all : all.filter((r) => r.status === status);

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Modération"
        title="Signalements"
        description="Contenus signalés par les fans. Traite les plus anciens en premier."
      />

      <KpiGrid cols={4}>
        <Kpi highlight label="Ouverts" value={count("open")} icon={Alert02Icon} sub="à traiter" />
        <Kpi label="En revue" value={count("reviewing")} icon={Clock01Icon} />
        <Kpi label="Résolus" value={count("resolved")} icon={CheckmarkCircle02Icon} />
        <Kpi label="Total" value={all.length} icon={Flag01Icon} sub="200 plus récents" />
      </KpiGrid>

      <SegmentedLinks
        value={status}
        options={[
          { value: "all", label: "Tous", href: "/goo-admin/signalements", count: all.length },
          { value: "open", label: "Ouverts", href: "/goo-admin/signalements?status=open", count: count("open") },
          { value: "reviewing", label: "En revue", href: "/goo-admin/signalements?status=reviewing", count: count("reviewing") },
          { value: "resolved", label: "Résolus", href: "/goo-admin/signalements?status=resolved", count: count("resolved") },
          { value: "dismissed", label: "Rejetés", href: "/goo-admin/signalements?status=dismissed", count: count("dismissed") },
        ]}
      />

      {reports.length === 0 ? (
        <Panel>
          <ConsoleEmpty title="Aucun signalement" hint="Rien à modérer pour ce filtre." />
        </Panel>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const track = one(r.tracks as TrackLite | TrackLite[] | null);
            const release = one(track?.releases ?? null);
            const reporter = one(r.profiles as ReporterLite | ReporterLite[] | null);
            const st = STATUS[r.status] ?? { label: r.status, tone: "neutral" as PillTone };
            return (
              <article
                key={r.id}
                className={`grid gap-4 rounded-2xl border bg-[#111113] p-4 lg:grid-cols-[1fr_280px] ${
                  r.status === "open" ? "border-red-500/20" : "border-white/[0.06]"
                }`}
              >
                <div className="flex gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white/[0.05]">
                    {release?.cover_url ? (
                      <AppImage src={release.cover_url} alt="" fill className="object-cover" sizes="64px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill tone={st.tone} dot>{st.label}</Pill>
                      <Pill tone="violet">{REASON_LABELS[r.reason] || r.reason}</Pill>
                      {release?.is_hidden ? <Pill tone="warn">Release masquée</Pill> : null}
                      <span className="text-[11px] text-zinc-500">
                        {new Date(r.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[15px] font-medium text-white">
                      {track?.title || "Morceau"}
                      {release ? (
                        <Link href={`/discover/release/${release.id}`} target="_blank" className="text-zinc-500 hover:text-zinc-300">
                          {" "}· {release.title}
                        </Link>
                      ) : null}
                    </p>
                    <p className="rounded-lg bg-white/[0.025] px-3 py-2 text-[13px] text-zinc-300">
                      {r.details || "Sans détails"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Signalé par {reporter?.display_name || "—"} · {reporter?.email}
                    </p>
                    {r.admin_note ? (
                      <p className="text-[12px] text-amber-200/90">Note admin : {r.admin_note}</p>
                    ) : null}
                  </div>
                </div>
                <ReportReviewForm reportId={r.id} currentStatus={r.status} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
