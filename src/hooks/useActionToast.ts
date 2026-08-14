"use client";

import { useEffect, useRef } from "react";
import { toastFromAction } from "@/lib/toast";

/** Affiche un toast quand une ActionState change (success / error). */
export function useActionToast(state: {
  error?: string;
  success?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  const prev = useRef(state);

  useEffect(() => {
    if (
      state.error !== prev.current.error ||
      state.success !== prev.current.success ||
      state.actionHref !== prev.current.actionHref
    ) {
      toastFromAction(state);
      prev.current = state;
    }
  }, [state]);
}
