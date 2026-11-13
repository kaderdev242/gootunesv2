"use client";

import { useOptimistic, useTransition } from "react";
import { setFeatureEnabled } from "@/lib/actions/admin";
import { toastError, toastSuccess } from "@/lib/toast";

export function FeatureToggle({
  featureKey,
  name,
  enabled,
}: {
  featureKey: string;
  name: string;
  enabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(enabled);

  const toggle = () => {
    const next = !on;
    startTransition(async () => {
      setOn(next);
      const res = await setFeatureEnabled(featureKey, next);
      if (res.error) toastError(res.error);
      else if (res.success) toastSuccess(res.success);
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${on ? "Désactiver" : "Activer"} ${name}`}
      disabled={pending}
      onClick={toggle}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-60 ${
        on ? "bg-white" : "bg-white/[0.12]"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full shadow transition-transform duration-200 ${
          on ? "translate-x-6 bg-black" : "translate-x-1 bg-white/70"
        }`}
      />
    </button>
  );
}
