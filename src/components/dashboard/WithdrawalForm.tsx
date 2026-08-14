"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@heroui/react";
import {
  checkWithdrawalStatus,
  initiateWithdrawal,
} from "@/lib/actions/finance";
import {
  getCountryLabel,
  getOperatorsForCountry,
  type MobileMoneyMethodId,
} from "@/lib/constants";
import { getMbiyoMinAmount, phonePlaceholder } from "@/lib/mbiyo/config";
import {
  clearPendingPayment,
  writePendingPayment,
} from "@/lib/purchases/pending";
import { isCountryCode } from "@/lib/geo";
import { CountryFlag } from "@/components/auth/CountryFlag";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import {
  currencyLabelForCountry,
  fcfaToLocal,
} from "@/lib/currency";

const initial: ActionState = {};

export function WithdrawalForm({
  balance,
  country,
  phone: defaultPhone,
}: {
  balance: number;
  country: string | null;
  phone: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(initiateWithdrawal, initial);
  useActionToast(state);

  const operators = useMemo(() => getOperatorsForCountry(country), [country]);
  const minAmount = getMbiyoMinAmount(country);
  const currencyLabel = currencyLabelForCountry(country);
  const balanceLocal = fcfaToLocal(balance, country);
  const [method, setMethod] = useState<MobileMoneyMethodId>(
    operators[0]?.id ?? "mtn",
  );
  const [waiting, setWaiting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (state?.paymentPending && state.orderId) {
      setWaiting(true);
      setOrderId(state.orderId);
      writePendingPayment({
        kind: "withdrawal",
        orderId: state.orderId,
        startedAt: Date.now(),
      });
    }
  }, [state]);

  useEffect(() => {
    if (!waiting || !orderId) return;
    let cancelled = false;

    const tick = async () => {
      const res = await checkWithdrawalStatus(orderId);
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
        router.refresh();
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
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
        <p className="text-white/45">Pays du compte</p>
        <p className="mt-1 flex items-center gap-2.5 font-medium text-white">
          {country && isCountryCode(country) ? (
            <CountryFlag code={country} title={getCountryLabel(country)} />
          ) : null}
          {getCountryLabel(country)}
        </p>
        <p className="mt-2 text-xs text-white/35">
          Minimum {minAmount} {currencyLabel} · solde réservé dès la demande.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Montant ({currencyLabel})</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={minAmount}
          max={balanceLocal}
          required
          placeholder={String(minAmount)}
          className="bg-white/5"
          disabled={waiting}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="payment_method">Opérateur</Label>
        <select
          id="payment_method"
          name="payment_method"
          required
          value={method}
          onChange={(e) => setMethod(e.target.value as MobileMoneyMethodId)}
          disabled={waiting}
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
        >
          {operators.map((m) => (
            <option key={m.id} value={m.id} className="bg-zinc-900">
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Numéro Mobile Money</Label>
        <Input
          id="phone"
          name="phone"
          required
          defaultValue={defaultPhone || ""}
          placeholder={phonePlaceholder(country)}
          className="bg-white/5"
          disabled={waiting}
        />
      </div>

      {waiting ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
          <p className="font-medium">Retrait en cours…</p>
          {orderId ? (
            <p className="mt-1 text-[11px] text-amber-100/50">Réf. {orderId}</p>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        isPending={pending || waiting}
        isDisabled={waiting || balanceLocal < minAmount}
        className="h-11 rounded-full bg-white font-semibold text-black"
      >
        {waiting ? "Envoi en cours…" : "Retirer"}
      </Button>
    </form>
  );
}
