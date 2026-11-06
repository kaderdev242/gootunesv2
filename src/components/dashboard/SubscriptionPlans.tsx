"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  checkLabelPlanStatus,
  initiateLabelPlan,
} from "@/lib/actions/label";
import {
  getOperatorsForCountry,
  LABEL_PLANS,
  type MobileMoneyMethodId,
} from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { phonePlaceholder } from "@/lib/mbiyo/config";
import {
  clearPendingPayment,
  writePendingPayment,
} from "@/lib/purchases/pending";
import type { ActionState } from "@/lib/actions/profile";
import type { LabelPlan } from "@/lib/supabase/database.types";
import { useActionToast } from "@/hooks/useActionToast";

const initial: ActionState = {};

export function SubscriptionPlans({
  current,
  country,
  defaultPhone,
}: {
  current: LabelPlan;
  country?: string | null;
  defaultPhone?: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(initiateLabelPlan, initial);
  useActionToast(state);
  const operators = useMemo(() => getOperatorsForCountry(country), [country]);
  const [method, setMethod] = useState<MobileMoneyMethodId>(
    operators[0]?.id ?? "mtn",
  );
  const [omOtp, setOmOtp] = useState("");
  const [phone, setPhone] = useState(defaultPhone || "");
  const [waiting, setWaiting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (state?.paymentPending && state.orderId) {
      setWaiting(true);
      setOrderId(state.orderId);
      writePendingPayment({
        kind: "label_plan",
        orderId: state.orderId,
        returnPath: "/label/abonnement",
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
      const res = await checkLabelPlanStatus(orderId);
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
      <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f10] p-4">
        <p className="text-xs text-white/50">Paiement Mobile Money</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-white/50">Opérateur</label>
            <select
              name="payment_method_shared"
              value={method}
              onChange={(e) => setMethod(e.target.value as MobileMoneyMethodId)}
              disabled={waiting}
              className="h-10 w-full rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-3 text-sm text-white"
            >
              {operators.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#121212] text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/50">
              Numéro Mobile Money
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={waiting}
              placeholder={phonePlaceholder(country)}
              className="h-10 w-full rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-3 text-sm text-white outline-none focus:border-white/20"
            />
          </div>
        </div>
        {country === "BF" && method === "orange" ? (
          <div className="mt-3">
            <p className="text-[11px] text-amber-300">
              Orange Burkina : compose{" "}
              <span className="font-semibold">*144*4*6*MONTANT#</span> (MONTANT = prix du plan choisi){" "}
              pour recevoir ton code, puis saisis-le ici.
            </p>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={omOtp}
              onChange={(e) => setOmOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
              disabled={waiting}
              placeholder="Code OTP Orange"
              className="mt-1.5 h-10 w-full rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-3 text-sm tracking-[0.3em] text-white outline-none focus:border-white/20"
            />
          </div>
        ) : null}
        {waiting ? (
          <p className="mt-3 text-xs text-amber-300">
            En attente de confirmation… {orderId ? `Réf. ${orderId}` : ""}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          Object.values(LABEL_PLANS) as (typeof LABEL_PLANS)[keyof typeof LABEL_PLANS][]
        ).map((plan) => (
          <form
            key={plan.id}
            action={action}
            className={`rounded-3xl border p-6 ${
              current === plan.id
                ? "border-white/20 bg-white/[0.06]"
                : "border-white/[0.06] bg-[#0f0f10]"
            }`}
          >
            <input type="hidden" name="plan" value={plan.id} />
            <input type="hidden" name="payment_method" value={method} />
            <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="om_otp" value={omOtp} />
            <p className="text-lg font-bold text-white">{plan.name}</p>
            <p className="mt-1 text-sm text-white/50">{plan.description}</p>
            <p className="studio-num mt-4 text-3xl font-bold text-white">
              {formatMoney(plan.price, country)}
              <span className="text-sm font-normal text-white/50"> / an</span>
            </p>
            <Button
              type="submit"
              isPending={pending || waiting}
              isDisabled={waiting || !phone.trim()}
              className="mt-5 w-full rounded-full bg-white hover:bg-white/90 font-semibold text-black"
            >
              {waiting
                ? "Paiement en cours…"
                : current === plan.id
                  ? "Renouveler"
                  : "Payer et activer"}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
