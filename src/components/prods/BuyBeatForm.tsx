"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { PaymentRedirectButton } from "@/components/payments/PaymentRedirectButton";
import { useActionToast } from "@/hooks/useActionToast";
import type { ActionState } from "@/lib/actions/profile";
import { getOperatorsForCountry, type MobileMoneyMethodId } from "@/lib/constants";
import { phonePlaceholder } from "@/lib/mbiyo/config";
import { checkBeatPurchaseStatus, initiateBeatPurchase } from "@/lib/prods/actions";
import type { BeatLicense } from "@/lib/supabase/database.types";

const initial: ActionState = {};

/** Paiement Mobile Money d'une licence — même parcours que l'achat musique. */
export function BuyBeatForm({
  beatPublicId,
  license,
  priceLabel,
  country,
  defaultPhone,
}: {
  beatPublicId: string;
  license: BeatLicense;
  priceLabel: string;
  country?: string | null;
  defaultPhone?: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(initiateBeatPurchase, initial);
  useActionToast(state);
  const operators = useMemo(() => getOperatorsForCountry(country), [country]);
  const [method, setMethod] = useState<MobileMoneyMethodId>(operators[0]?.id ?? "mtn");
  const [phone, setPhone] = useState(defaultPhone || "");
  const orderId = state?.paymentPending && state.orderId ? state.orderId : null;
  const [failedOrder, setFailedOrder] = useState<string | null>(null);
  const doneRef = useRef(false);
  const failed = Boolean(orderId) && failedOrder === orderId;
  const waiting = Boolean(orderId) && !failed;

  useEffect(() => {
    if (state?.paymentPending && state.redirectUrl) {
      window.open(state.redirectUrl, "_blank", "noopener,noreferrer");
    }
  }, [state]);

  useEffect(() => {
    if (!state?.success || state.paymentPending || doneRef.current) return;
    doneRef.current = true;
    router.replace("/prods/achats");
  }, [router, state?.paymentPending, state?.success]);

  useEffect(() => {
    if (!waiting || !orderId) return;
    let cancelled = false;
    const tick = async () => {
      const res = await checkBeatPurchaseStatus(orderId);
      if (cancelled) return;
      if (res.status === "completed" && !doneRef.current) {
        doneRef.current = true;
        router.replace("/prods/achats");
      } else if (res.status === "failed" || res.status === "cancelled") {
        setFailedOrder(orderId);
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [waiting, orderId, router]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="beat_id" value={beatPublicId} />
      <input type="hidden" name="license" value={license} />

      <div>
        <label className="mb-1.5 block text-xs text-white/45">Opérateur</label>
        <select
          name="payment_method"
          value={method}
          onChange={(e) => setMethod(e.target.value as MobileMoneyMethodId)}
          disabled={waiting}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white"
        >
          {operators.map((m) => (
            <option key={m.id} value={m.id} className="bg-zinc-900">
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-white/45">Numéro Mobile Money</label>
        <input
          name="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={waiting}
          placeholder={phonePlaceholder(country)}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-white/25"
        />
        {country === "CG" ? <p className="mt-1.5 text-[11px] text-white/35">Congo : MTN uniquement, numéro 06…</p> : null}
        {country === "BF" && method === "orange" ? (
          <input
            name="om_otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{4,8}"
            required
            disabled={waiting}
            placeholder="Code OTP Orange"
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm tracking-[0.3em] text-white outline-none"
          />
        ) : null}
      </div>

      {state?.instructionsHtml ? (
        <div
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70 [&_a]:underline [&_strong]:text-white"
          dangerouslySetInnerHTML={{ __html: state.instructionsHtml }}
        />
      ) : null}
      {waiting && state?.redirectUrl ? <PaymentRedirectButton url={state.redirectUrl} network={method} /> : null}

      {waiting ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
          <p className="font-medium">En attente de confirmation…</p>
          <p className="mt-1 text-xs text-amber-100/70">Valide le paiement sur ton téléphone.</p>
          <p className="mt-2 text-[11px] text-amber-100/50">Réf. {orderId}</p>
        </div>
      ) : null}
      {failed ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">Paiement échoué ou annulé. Réessaie.</p>
      ) : null}

      <Button
        type="submit"
        isPending={pending || waiting}
        isDisabled={waiting}
        className="h-12 rounded-full bg-white text-sm font-semibold text-black"
      >
        {waiting ? "Paiement en cours…" : `Payer ${priceLabel}`}
      </Button>
    </form>
  );
}
