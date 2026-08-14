"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  checkArtistPlanStatus,
  initiateArtistPlan,
} from "@/lib/actions/artist-plan";
import {
  ARTIST_PLAN,
  getOperatorsForCountry,
  type MobileMoneyMethodId,
} from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { phonePlaceholder } from "@/lib/mbiyo/config";
import {
  clearPendingPayment,
  writePendingPayment,
} from "@/lib/purchases/pending";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import { hasActiveArtistPlan } from "@/lib/artist-plan";

const initial: ActionState = {};

export function ArtistSubscriptionPlans({
  currentPlan,
  expiresAt,
  country,
  defaultPhone,
}: {
  currentPlan: string;
  expiresAt?: string | null;
  country?: string | null;
  defaultPhone?: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(initiateArtistPlan, initial);
  useActionToast(state);
  const operators = useMemo(() => getOperatorsForCountry(country), [country]);
  const [method, setMethod] = useState<MobileMoneyMethodId>(
    operators[0]?.id ?? "mtn",
  );
  const [phone, setPhone] = useState(defaultPhone || "");
  const [waiting, setWaiting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const doneRef = useRef(false);
  const active = hasActiveArtistPlan({
    artist_plan: currentPlan,
    artist_plan_expires_at: expiresAt,
  });

  useEffect(() => {
    if (state?.paymentPending && state.orderId) {
      setWaiting(true);
      setOrderId(state.orderId);
      writePendingPayment({
        kind: "artist_plan",
        orderId: state.orderId,
        returnPath: "/artist/abonnement",
        startedAt: Date.now(),
      });
      if (state.redirectUrl) {
        window.open(state.redirectUrl, "_blank", "noopener,noreferrer");
      }
    }
  }, [state]);

  useEffect(() => {
    if (!waiting || !orderId) return;
    let cancelled = false;

    const tick = async () => {
      const res = await checkArtistPlanStatus(orderId);
      if (cancelled) return;
      if (res.status === "completed") {
        setWaiting(false);
        clearPendingPayment();
        if (!doneRef.current) {
          doneRef.current = true;
          router.refresh();
        }
        return;
      }
      if (res.status === "failed" || res.status === "cancelled") {
        setWaiting(false);
        clearPendingPayment();
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [waiting, orderId, router]);

  useEffect(() => {
    if (!state?.success || state.paymentPending || doneRef.current) return;
    doneRef.current = true;
    clearPendingPayment();
    router.refresh();
  }, [router, state?.paymentPending, state?.success]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-white/45">Paiement Mobile Money</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-white/45">Opérateur</label>
            <select
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
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={waiting}
              placeholder={phonePlaceholder(country)}
              className="h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
        </div>
        {waiting ? (
          <p className="mt-3 text-xs text-amber-100/80">
            En attente de confirmation… {orderId ? `Réf. ${orderId}` : ""}
          </p>
        ) : null}
      </div>

      <form
        action={action}
        className={`max-w-md rounded-3xl border p-6 ${
          active ? "border-white/40 bg-white/10" : "border-white/10 bg-white/5"
        }`}
      >
        <input type="hidden" name="payment_method" value={method} />
        <input type="hidden" name="phone" value={phone} />
        <p className="text-lg font-bold text-white">{ARTIST_PLAN.name}</p>
        <p className="mt-1 text-sm text-white/45">{ARTIST_PLAN.description}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-white/60">
          <li>· Singles et albums illimités</li>
          <li>· Accès Discover & ventes Mobile Money</li>
          <li>· Valable 12 mois</li>
        </ul>
        <p className="font-display mt-5 text-3xl font-bold text-white">
          {formatMoney(ARTIST_PLAN.price, country)}
          <span className="text-sm font-normal text-white/40"> / an</span>
        </p>
        <Button
          type="submit"
          isPending={pending || waiting}
          isDisabled={waiting || !phone.trim()}
          className="mt-5 w-full rounded-full bg-white font-semibold text-black"
        >
          {waiting
            ? "Paiement en cours…"
            : active
              ? "Renouveler"
              : "Payer et activer"}
        </Button>
      </form>
    </div>
  );
}
