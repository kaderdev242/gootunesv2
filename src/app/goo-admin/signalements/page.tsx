import { listReportsAdmin } from "@/lib/admin/queries";
import { ReportReviewForm } from "@/components/admin/AdminActionForms";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const REASON_LABELS: Record<string, string> = {
  copyright: "Droit d'auteur",
  illegal: "Illégal",
  spam: "Spam",
  hate: "Haine",
  other: "Autre",
};

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
    sp.status === "open" ||
    sp.status === "reviewing" ||
    sp.status === "resolved" ||
    sp.status === "dismissed"
      ? sp.status
      : "all";

  const reports = await listReportsAdmin(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AdminPageHeader
          title="Signalements"
          description={`${reports.length} signalement(s)`}
        />
        <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-zinc-200/70 p-1 text-xs">
          {[
            ["all", "Tous"],
            ["open", "Ouverts"],
            ["reviewing", "En revue"],
            ["resolved", "Résolus"],
            ["dismissed", "Rejetés"],
          ].map(([value, label]) => (
            <a
              key={value}
              href={
                value === "all"
                  ? "/goo-admin/signalements"
                  : `/goo-admin/signalements?status=${value}`
              }
              className={`rounded-xl px-3 py-1.5 font-medium transition ${
                status === value
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="rounded-[28px] border border-zinc-200/80 bg-white px-6 py-12 text-center text-sm text-zinc-400 shadow-sm">
            Aucun signalement.
          </div>
        ) : (
          reports.map((r) => {
            const track = one(
              r.tracks as
                | {
                    id: string;
                    title: string;
                    release_id: string;
                    releases:
                      | {
                          id: string;
                          title: string;
                          is_hidden: boolean;
                          cover_url: string | null;
                        }
                      | {
                          id: string;
                          title: string;
                          is_hidden: boolean;
                          cover_url: string | null;
                        }[]
                      | null;
                  }
                | {
                    id: string;
                    title: string;
                    release_id: string;
                    releases:
                      | {
                          id: string;
                          title: string;
                          is_hidden: boolean;
                          cover_url: string | null;
                        }
                      | {
                          id: string;
                          title: string;
                          is_hidden: boolean;
                          cover_url: string | null;
                        }[]
                      | null;
                  }[]
                | null,
            );
            const release = one(track?.releases || null);
            const reporter = one(
              r.profiles as
                | { display_name: string | null; email: string | null }
                | { display_name: string | null; email: string | null }[]
                | null,
            );

            return (
              <article
                key={r.id}
                className="grid gap-4 rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/5 lg:grid-cols-[1fr_260px]"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      {REASON_LABELS[r.reason] || r.reason}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {r.status}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(r.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <p className="font-medium text-zinc-900">
                    {track?.title || "Morceau"}
                    {release ? (
                      <span className="text-zinc-400">
                        {" "}
                        · {release.title}
                        {release.is_hidden ? " (masqué)" : ""}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {r.details || "Sans détails"}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Par {reporter?.display_name || "—"} ({reporter?.email})
                  </p>
                  {r.admin_note ? (
                    <p className="text-xs text-amber-700">
                      Note : {r.admin_note}
                    </p>
                  ) : null}
                </div>
                <ReportReviewForm reportId={r.id} currentStatus={r.status} />
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
