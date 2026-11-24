"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminCheckPayment,
  adminResendWebhook,
  adminValidatePayment,
  type PaymentCheck,
} from "@/lib/actions/admin-payments";
import { consoleButtonClass } from "@/components/admin/console/ui";
import { formatFcfa } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";

const STATUS_FR: Record<string, string> = {
  successful: "Réussi",
  success: "Réussi",
  completed: "Réussi",
  pending: "En attente",
  failed: "Échec",
  cancelled: "Annulé",
};

const OUTCOME_FR: Record<string, string> = {
  fulfilled: "Débloqué automatiquement",
  already_done: "Déjà débloqué",
  failed: "Échec confirmé par Mbiyo",
  held: "Mis de côté (montant à vérifier)",
  still_pending: "Encore en attente chez Mbiyo",
  bad_signature: "Webhook refusé : signature invalide",
  unknown_order: "Webhook pour une commande inconnue",
  verify_unavailable: "Mbiyo injoignable au moment du webhook",
  order_mismatch: "Commande incohérente",
  error: "Erreur de traitement",
  checked: "Vérifié par un admin",
  validated: "Validé par un admin",
  force_validated: "Validation forcée par un admin",
  webhook_resent: "Webhook renvoyé et accepté",
  webhook_resent_not_acknowledged: "Webhook renvoyé mais refusé",
};

const SOURCE_FR: Record<string, string> = { webhook: "Webhook", reconcile: "Rapprochement", admin: "Admin" };

function when(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Vérification et validation manuelle d'un paiement Mobile Money. */
export function PaymentReviewModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const router = useRouter();
  const [data, setData] = useState<PaymentCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [forcing, setForcing] = useState(false);
  const [confirmWord, setConfirmWord] = useState("");
  const [pending, start] = useTransition();

  const load = () => {
    setLoading(true);
    adminCheckPayment(orderId)
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    adminCheckPayment(orderId)
      .then((d) => !cancelled && setData(d))
      .finally(() => !cancelled && setLoading(false));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
    };
  }, [orderId, onClose]);

  const order = data?.order;
  const mbiyo = data?.mbiyo;
  const confirmed = Boolean(mbiyo?.found && mbiyo.status && ["successful", "success", "completed"].includes(mbiyo.status) && data?.amountMatches);
  const done = order?.status === "completed";

  const validate = (force: boolean) =>
    start(async () => {
      const res = await adminValidatePayment({ orderId, note, force });
      if (res.error) {
        toastError(res.error);
        return;
      }
      toastSuccess(res.success || "Validé");
      router.refresh();
      onClose();
    });

  const resend = () =>
    start(async () => {
      const res = await adminResendWebhook(orderId);
      if (res.error) toastError(res.error);
      else toastSuccess(res.success || "Webhook renvoyé");
      load();
      router.refresh();
    });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-review-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#121214] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="payment-review-title" className="text-lg font-semibold text-white">
              Vérifier le paiement
            </h2>
            <p className="mt-1 font-mono text-[12px] text-zinc-500">{orderId}</p>
          </div>
          <button type="button" onClick={onClose} className={consoleButtonClass("ghost")}>
            Fermer
          </button>
        </div>

        {loading && !data ? (
          <p className="mt-6 text-sm text-zinc-400">Interrogation de Mbiyo…</p>
        ) : data?.error ? (
          <p className="mt-6 text-sm text-red-300">{data.error}</p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[12px] text-zinc-500">Chez Gootunes</p>
                <p className="mt-1 text-sm font-medium text-white">{STATUS_FR[order?.status ?? ""] ?? order?.status}</p>
                <dl className="mt-3 space-y-1 text-[13px] text-zinc-400">
                  <div className="flex justify-between gap-3"><dt>Prix</dt><dd className="text-zinc-200">{formatFcfa(order?.amountFcfa ?? 0)}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Montant attendu</dt><dd className="text-zinc-200">{order?.expectedAmount ?? "—"} {order?.expectedCurrency ?? ""}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Commande</dt><dd className="text-zinc-200">{when(order?.createdAt)}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Transaction</dt><dd className="truncate font-mono text-[11px] text-zinc-300">{order?.transactionId ?? "—"}</dd></div>
                </dl>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  confirmed ? "border-emerald-400/30 bg-emerald-400/[0.06]" : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <p className="text-[12px] text-zinc-500">Chez Mbiyo</p>
                {data?.mbiyoError ? (
                  <p className="mt-1 text-sm text-amber-300">Injoignable : {data.mbiyoError}</p>
                ) : !mbiyo?.found ? (
                  <p className="mt-1 text-sm text-amber-300">Transaction introuvable</p>
                ) : (
                  <>
                    <p className={`mt-1 text-sm font-medium ${confirmed ? "text-emerald-300" : "text-white"}`}>
                      {STATUS_FR[mbiyo.status ?? ""] ?? mbiyo.status}
                      {mbiyo.status && ["successful", "success"].includes(mbiyo.status) && !data?.amountMatches ? " · montant différent" : ""}
                    </p>
                    <dl className="mt-3 space-y-1 text-[13px] text-zinc-400">
                      <div className="flex justify-between gap-3"><dt>Payé</dt><dd className="text-zinc-200">{mbiyo.amount} {mbiyo.currency}</dd></div>
                      <div className="flex justify-between gap-3"><dt>Numéro</dt><dd className="text-zinc-200">{mbiyo.phone ?? "—"} {mbiyo.network ? `· ${mbiyo.network}` : ""}</dd></div>
                      <div className="flex justify-between gap-3"><dt>Mis à jour</dt><dd className="text-zinc-200">{when(mbiyo.updatedAt)}</dd></div>
                      <div className="flex justify-between gap-3"><dt>Transaction</dt><dd className="truncate font-mono text-[11px] text-zinc-300">{mbiyo.transactionId}</dd></div>
                    </dl>
                  </>
                )}
              </div>
            </div>

            {done ? (
              <p className="mt-5 rounded-xl bg-emerald-400/[0.08] p-3 text-sm text-emerald-200">Ce paiement est déjà validé : tout est débloqué.</p>
            ) : (
              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="text-[12px] text-zinc-500">
                    Note de vérification {confirmed ? "(facultative)" : "(obligatoire pour forcer, 10 caractères min.)"}
                  </span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Ex. : débit vu sur le dashboard Mbiyo, capture envoyée par le client"
                    className="mt-1 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                  />
                </label>

                {confirmed ? (
                  <button type="button" disabled={pending} onClick={() => validate(false)} className={`${consoleButtonClass("primary")} w-full justify-center`}>
                    {pending ? "Validation…" : "Valider le paiement et tout débloquer"}
                  </button>
                ) : forcing ? (
                  <div className="space-y-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.05] p-3">
                    <p className="text-[13px] leading-relaxed text-amber-100">
                      Mbiyo ne confirme pas ce paiement. Ne force que si tu as vérifié le débit toi-même (dashboard Mbiyo, preuve du client). Écris VALIDER pour confirmer.
                    </p>
                    <input
                      value={confirmWord}
                      onChange={(e) => setConfirmWord(e.target.value)}
                      placeholder="VALIDER"
                      className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={pending || confirmWord.trim() !== "VALIDER" || note.trim().length < 10}
                      onClick={() => validate(true)}
                      className={`${consoleButtonClass("primary")} w-full justify-center`}
                    >
                      {pending ? "Validation…" : "Forcer la validation"}
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setForcing(true)} className={`${consoleButtonClass("ghost")} w-full justify-center`}>
                    Mbiyo ne confirme pas : forcer après vérification manuelle
                  </button>
                )}

                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={pending} onClick={load} className={consoleButtonClass("ghost")}>
                    Revérifier chez Mbiyo
                  </button>
                  {order?.transactionId ? (
                    <button type="button" disabled={pending} onClick={resend} className={consoleButtonClass("ghost")}>
                      Renvoyer le webhook
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-[12px] text-zinc-500">Historique</p>
              {data?.events?.length ? (
                <ul className="mt-2 space-y-2">
                  {data.events.map((ev) => (
                    <li key={ev.id} className="rounded-lg bg-white/[0.02] px-3 py-2 text-[13px]">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-zinc-200">{OUTCOME_FR[ev.outcome.split(":")[0]] ?? ev.outcome}</span>
                        <span className="text-[11px] text-zinc-500">
                          {SOURCE_FR[ev.source] ?? ev.source} · {when(ev.created_at)}
                          {ev.mbiyo_status ? ` · Mbiyo ${STATUS_FR[ev.mbiyo_status] ?? ev.mbiyo_status}` : ""}
                        </span>
                      </div>
                      {ev.detail ? <p className="mt-1 text-[12px] text-zinc-500">{ev.detail}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-zinc-500">Aucun événement enregistré (avant cette mise à jour).</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
