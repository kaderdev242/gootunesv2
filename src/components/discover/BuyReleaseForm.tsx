"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  checkPurchaseStatus,
  initiatePurchase,
} from "@/lib/actions/finance";
import {
  getOperatorsForCountry,
  type MobileMoneyMethodId,
} from "@/lib/constants";
import { phonePlaceholder } from "@/lib/mbiyo/config";
import {
  clearPendingPurchase,
  writePendingPurchase,
} from "@/lib/purchases/pending";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import { usePlayer } from "@/components/feed/PlayerProvider";

const initial: ActionState = {};

export function BuyReleaseForm({
  releaseId,
  releasePublicId,
  title,
  priceLabel,
  country,
  defaultPhone,
}: {
  releaseId: string;
  releasePublicId?: string;
  title: string;
  priceLabel: string;
  country?: string | null;
  defaultPhone?: string | null;
}) {
  const detailPath = `/discover/release/${releasePublicId || releaseId}`;
  const router = useRouter();
  const { current, refreshAccess } = usePlayer();
  const [state, action, pending] = useActionState(initiatePurchase, initial);
  useActionToast(state);
  const doneRef = useRef(false);
  const operators = useMemo(() => getOperatorsForCountry(country), [country]);
  const [method, setMethod] = useState<MobileMoneyMethodId>(
    operators[0]?.id ?? "mtn",
  );
  const [phone, setPhone] = useState(defaultPhone || "");
  const [waiting, setWaiting] = useState(false);
  const [waitMsg, setWaitMsg] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (state?.paymentPending && state.orderId) {
      setWaiting(true);
      setOrderId(state.orderId);
      setWaitMsg(
        state.success ||
          "Valide le paiement sur ton téléphone, on finalise ensuite…",
      );
      writePendingPurchase({
        kind: "purchase",
        orderId: state.orderId,
        releaseId,
        startedAt: Date.now(),
      });
      if (state.redirectUrl) {
        window.open(state.redirectUrl, "_blank", "noopener,noreferrer");
      }
    }
  }, [releaseId, state]);

  // Polling local rapide tant qu'on reste sur la page d'achat
  useEffect(() => {
    if (!waiting || !orderId) return;
    let cancelled = false;

    const tick = async () => {
      const res = await checkPurchaseStatus(orderId);
      if (cancelled) return;
      if (res.status === "completed") {
        setWaiting(false);
        clearPendingPurchase();
        if (!doneRef.current) {
          doneRef.current = true;
          if (current?.releaseId === releaseId) void refreshAccess();
          router.replace(detailPath);
        }
        return;
      }
      if (res.status === "failed" || res.status === "cancelled") {
        setWaiting(false);
        clearPendingPurchase();
        setWaitMsg("Paiement échoué ou annulé. Réessaie.");
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    waiting,
    orderId,
    current?.releaseId,
    detailPath,
    refreshAccess,
    releaseId,
    router,
  ]);

  useEffect(() => {
    if (!state?.success || state.paymentPending || doneRef.current) return;
    doneRef.current = true;
    clearPendingPurchase();
    if (current?.releaseId === releaseId) void refreshAccess();
    router.replace(detailPath);
  }, [
    current?.releaseId,
    detailPath,
    refreshAccess,
    releaseId,
    router,
    state?.paymentPending,
    state?.success,
  ]);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
      aria-label={`Acheter ${title}`}
    >
      <input type="hidden" name="release_id" value={releaseId} />
      <p className="text-xs text-white/45">{priceLabel} · Mobile Money</p>

      <div>
        <label className="mb-1.5 block text-xs text-white/45">Opérateur</label>
        <select
          name="payment_method"
          required
          value={method}
          onChange={(e) => setMethod(e.target.value as MobileMoneyMethodId)}
          disabled={waiting}
          className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white"
        >
          {operators.map((m) => (
            <option key={m.id} value={m.id} className="bg-zinc-900">
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-white/45">
          Numéro Mobile Money
        </label>
        <input
          name="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={waiting}
          placeholder={phonePlaceholder(country)}
          className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-white/25"
        />
        {country === "CG" ? (
          <p className="mt-1.5 text-[11px] text-white/35">
            Congo : MTN uniquement, numéro 06…
          </p>
        ) : null}
        {country === "SN" && method === "orange" ? (
          <p className="mt-1.5 text-[11px] text-amber-100/70">
            Avant de payer : compose{" "}
            <span className="font-medium text-amber-100">#144#391#</span> sur
            ton téléphone, puis valide ici.
          </p>
        ) : null}
        {country === "CI" && method === "orange" ? (
          <p className="mt-1.5 text-[11px] text-amber-100/70">
            Orange CI : compose{" "}
            <span className="font-medium text-amber-100">#144*82#</span> si
            demandé pour autoriser le paiement.
          </p>
        ) : null}
      </div>

      {state?.instructionsHtml ? (
        <div
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70 [&_a]:underline [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-white"
          dangerouslySetInnerHTML={{ __html: state.instructionsHtml }}
        />
      ) : null}

      {waiting ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
          <p className="font-medium">En attente de confirmation…</p>
          <p className="mt-1 text-xs text-amber-100/70">{waitMsg}</p>
          <p className="mt-1 text-[11px] text-amber-100/50">
            Tu peux quitter cette page : la validation continue en arrière-plan.
          </p>
          {orderId ? (
            <p className="mt-2 text-[11px] text-amber-100/50">Réf. {orderId}</p>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        isPending={pending || waiting}
        isDisabled={waiting}
        className="rounded-full bg-white text-sm font-semibold text-black"
      >
        {waiting ? "Paiement en cours…" : "Payer maintenant"}
      </Button>
    </form>
  );
}
