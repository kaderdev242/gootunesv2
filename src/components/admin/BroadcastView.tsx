"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminSendEmail,
  adminSendPush,
  previewEmailHtml,
  type Audience,
  type AudienceCounts,
  type BroadcastRow,
} from "@/lib/actions/admin-broadcast";
import { ConsoleHeader, Panel, Segmented, T, consoleButtonClass } from "@/components/admin/console/ui";
import { toastError, toastSuccess } from "@/lib/toast";

type Channel = "push" | "email";

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "all", label: "Tout le monde" },
  { value: "fans", label: "Fans" },
  { value: "artists", label: "Artistes" },
  { value: "labels", label: "Labels" },
  { value: "creators", label: "Artistes et labels" },
  { value: "one", label: "Un compte" },
];

const AUDIENCE_FR: Record<string, string> = {
  ...Object.fromEntries(AUDIENCES.map((a) => [a.value, a.label])),
  test: "Test (moi)",
};

/** Formulation de la confirmation : « 121 comptes », « 42 fans »… */
const AUDIENCE_COUNT_FR: Record<string, [string, string]> = {
  all: ["compte", "comptes"],
  fans: ["fan", "fans"],
  artists: ["artiste", "artistes"],
  labels: ["label", "labels"],
  creators: ["artiste ou label", "artistes et labels"],
};

const SCREENS = [
  { value: "home", label: "Accueil" },
  { value: "revenus", label: "Revenus" },
  { value: "retraits", label: "Retraits" },
  { value: "catalogue", label: "Catalogue" },
  { value: "profil", label: "Profil" },
];

const field =
  "mt-1 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/30";

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={`text-[11px] tabular-nums ${value.length > max ? "text-red-300" : "text-zinc-500"}`}>
      {value.length}/{max}
    </span>
  );
}

export function BroadcastView({
  channel,
  counts,
  history,
}: {
  channel: Channel;
  counts: AudienceCounts | null;
  history: BroadcastRow[];
}) {
  const router = useRouter();
  const isPush = channel === "push";
  const [audience, setAudience] = useState<Audience>(isPush ? "creators" : "all");
  const [target, setTarget] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [screen, setScreen] = useState("home");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState("");
  const [pending, start] = useTransition();

  const audiences = isPush ? AUDIENCES.filter((a) => a.value !== "fans") : AUDIENCES;
  const reach =
    audience === "one" ? 1 : (isPush ? counts?.push : counts?.email)?.[audience as Exclude<Audience, "one">] ?? 0;
  const ready = isPush ? counts?.pushReady : counts?.emailReady;

  const valid = useMemo(() => {
    if (isPush) return title.trim() && title.length <= 65 && body.trim() && body.length <= 180;
    return subject.trim() && subject.length <= 120 && title.trim() && body.trim() && body.length <= 5000;
  }, [isPush, title, body, subject]);
  const targetOk = audience !== "one" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.trim());

  // Aperçu e-mail : rendu exact du gabarit, rafraîchi pendant la saisie.
  useEffect(() => {
    if (isPush) return;
    const id = setTimeout(() => {
      previewEmailHtml({ title, body, ctaLabel, ctaUrl }).then(setPreview);
    }, 400);
    return () => clearTimeout(id);
  }, [isPush, title, body, ctaLabel, ctaUrl]);

  const send = (test: boolean) =>
    start(async () => {
      const res = isPush
        ? await adminSendPush({ audience, email: target, title, body, screen, test })
        : await adminSendEmail({ audience, email: target, subject, title, body, ctaLabel, ctaUrl, test });
      setConfirming(false);
      if (res.error) {
        toastError(res.error);
        return;
      }
      toastSuccess(res.success || "Envoyé");
      if (!test) {
        setSubject("");
        setTitle("");
        setBody("");
        setCtaLabel("");
        setCtaUrl("");
      }
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <ConsoleHeader
        kicker="Communication"
        title={isPush ? "Notifications" : "E-mails"}
        description={
          isPush
            ? "Notifications push sur les téléphones des utilisateurs de l'app Gootunes Artistes. Fais un test sur ton téléphone avant d'envoyer."
            : "E-mails aux comptes Gootunes, un envoi par personne (personne ne voit les autres adresses). Fais un test avant d'envoyer."
        }
      />

      {!ready ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-3 text-sm text-amber-100">
          {isPush
            ? "Firebase n'est pas encore configuré sur le serveur : ajoute FIREBASE_SERVICE_ACCOUNT dans Dokploy pour envoyer des notifications."
            : "Resend n'est pas configuré sur le serveur (RESEND_API_KEY)."}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Rédiger" subtitle={`${reach} destinataire${reach > 1 ? "s" : ""}${isPush ? " (comptes avec l'app installée)" : ""}`}>
          <div className="space-y-4">
            <div>
              <span className="text-[12px] text-zinc-500">Audience</span>
              <div className="mt-1">
                <Segmented<Audience>
                  value={audience}
                  onChange={setAudience}
                  options={audiences.map((a) => ({
                    value: a.value,
                    label: a.label,
                    count: a.value === "one" ? undefined : (isPush ? counts?.push : counts?.email)?.[a.value as Exclude<Audience, "one">],
                  }))}
                />
              </div>
              {audience === "one" ? (
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="E-mail du compte"
                  type="email"
                  className={field}
                />
              ) : null}
              {isPush ? (
                <p className="mt-2 text-[12px] text-zinc-500">
                  L&apos;app fan n&apos;a pas encore les notifications : seuls les artistes et labels de l&apos;app Gootunes Artistes les reçoivent.
                </p>
              ) : null}
            </div>

            {!isPush ? (
              <label className="block">
                <span className="flex justify-between text-[12px] text-zinc-500">
                  Objet <Counter value={subject} max={120} />
                </span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className={field} placeholder="Nouveau sur Gootunes : …" />
              </label>
            ) : null}

            <label className="block">
              <span className="flex justify-between text-[12px] text-zinc-500">
                Titre <Counter value={title} max={isPush ? 65 : 120} />
              </span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder={isPush ? "Ex. : Les retraits sont plus rapides" : "Titre affiché dans l'e-mail"} />
            </label>

            <label className="block">
              <span className="flex justify-between text-[12px] text-zinc-500">
                Message <Counter value={body} max={isPush ? 180 : 5000} />
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={isPush ? 3 : 9}
                className={field}
                placeholder={isPush ? "Texte court, une ou deux phrases" : "Sépare les paragraphes par une ligne vide"}
              />
            </label>

            {isPush ? (
              <div>
                <span className="text-[12px] text-zinc-500">Écran ouvert au toucher</span>
                <div className="mt-1">
                  <Segmented<string> value={screen} onChange={setScreen} options={SCREENS} />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[12px] text-zinc-500">Bouton (facultatif)</span>
                  <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={field} placeholder="Découvrir" />
                </label>
                <label className="block">
                  <span className="text-[12px] text-zinc-500">Lien du bouton</span>
                  <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={field} placeholder="/discover ou https://…" />
                </label>
              </div>
            )}

            {confirming ? (
              <div className="space-y-3 rounded-xl border border-white/[0.1] bg-white/[0.03] p-4">
                <p className="text-sm text-zinc-200">
                  Envoyer {isPush ? "cette notification" : "cet e-mail"} à{" "}
                  <b className="text-white">
                    {audience === "one"
                      ? target.trim()
                      : `${reach} ${AUDIENCE_COUNT_FR[audience][reach > 1 ? 1 : 0]}`}
                  </b>{" "}
                  ? Impossible d&apos;annuler une fois parti.
                </p>
                <div className="flex gap-2">
                  <button type="button" disabled={pending} onClick={() => send(false)} className={consoleButtonClass("primary")}>
                    {pending ? "Envoi…" : "Confirmer l'envoi"}
                  </button>
                  <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={consoleButtonClass("ghost")}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending || !valid || !ready}
                  onClick={() => send(true)}
                  className={consoleButtonClass("ghost")}
                >
                  {pending ? "Envoi…" : "Envoyer un test à moi"}
                </button>
                <button
                  type="button"
                  disabled={pending || !valid || !targetOk || !ready || reach === 0}
                  onClick={() => setConfirming(true)}
                  className={consoleButtonClass("primary")}
                >
                  Envoyer
                </button>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Aperçu">
          {isPush ? (
            <div className="rounded-[28px] bg-gradient-to-b from-zinc-700 to-zinc-900 p-4">
              <p className="py-6 text-center text-5xl font-light tabular-nums text-white/90">9:41</p>
              <div className="rounded-2xl bg-white/80 p-3 text-zinc-900 backdrop-blur">
                <div className="flex items-center gap-2 text-[12px] text-zinc-600">
                  <span className="flex size-5 items-center justify-center rounded-md bg-[#0057FF] text-[10px] font-bold text-white">G</span>
                  <span className="flex-1">GOOTUNES ARTISTES</span>
                  <span>maintenant</span>
                </div>
                <p className="mt-1.5 text-[14px] font-semibold">{title.trim() || "Titre de la notification"}</p>
                <p className="text-[14px] leading-snug text-zinc-700">{body.trim() || "Ton message apparaîtra ici."}</p>
              </div>
            </div>
          ) : (
            <iframe
              title="Aperçu de l'e-mail"
              srcDoc={preview}
              sandbox=""
              className="h-[560px] w-full rounded-xl border border-white/[0.06] bg-white"
            />
          )}
        </Panel>
      </div>

      <Panel flush title="Historique" subtitle={`${history.length} envoi${history.length > 1 ? "s" : ""} récent${history.length > 1 ? "s" : ""}`}>
        <div className={T.wrap}>
          <table className={`${T.table} min-w-[720px]`}>
            <thead className={T.thead}>
              <tr>
                <th className={T.th}>Date</th>
                <th className={T.th}>{isPush ? "Notification" : "Objet"}</th>
                <th className={T.th}>Audience</th>
                <th className={`${T.th} text-right`}>Reçus</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${T.td} text-zinc-500`}>
                    Aucun envoi pour l&apos;instant
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className={T.tr}>
                    <td className={`${T.td} whitespace-nowrap text-zinc-400`}>
                      {new Date(h.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className={T.td}>
                      <p className={T.strong}>{h.title}</p>
                      <p className={`${T.sub} line-clamp-1`}>{h.body}</p>
                    </td>
                    <td className={T.td}>
                      {AUDIENCE_FR[h.audience] ?? h.audience}
                      {h.target_email ? <span className={`${T.sub} block`}>{h.target_email}</span> : null}
                    </td>
                    <td className={`${T.td} text-right tabular-nums`}>
                      {h.sent}/{h.recipients}
                      {h.failed ? <span className="block text-[11px] text-red-300">{h.failed} en échec</span> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
