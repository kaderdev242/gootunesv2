"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { checkPaymentOrderStatus } from "@/lib/actions/finance";
import {
  clearPendingPayment,
  readPendingPayment,
} from "@/lib/purchases/pending";
import { usePlayer } from "@/components/feed/PlayerProvider";
import { toastError, toastSuccess } from "@/lib/toast";

/**
 * Polling fond Discover : achats (GT-), et reprise sessionStorage.
 */
export function PendingPurchasePoller() {
  const router = useRouter();
  const { current, refreshAccess } = usePlayer();
  const busyRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (busyRef.current || doneRef.current) return;
      const pending = readPendingPayment();
      if (
        !pending ||
        pending.kind === "label_plan" ||
        pending.kind === "artist_plan" ||
        pending.kind === "withdrawal"
      ) {
        // Label / artiste / retrait : pollés dans leurs propres formulaires
        return;
      }

      busyRef.current = true;
      try {
        const res = await checkPaymentOrderStatus(pending.orderId);
        if (cancelled) return;

        if (res.status === "completed") {
          doneRef.current = true;
          clearPendingPayment();
          if (pending.releaseId && current?.releaseId === pending.releaseId) {
            void refreshAccess();
          }
          toastSuccess("Paiement confirmé", "Écoute complète débloquée.");
          router.refresh();
          return;
        }

        if (res.status === "failed" || res.status === "cancelled") {
          clearPendingPayment();
          toastError("Paiement échoué ou annulé.");
        }
      } finally {
        busyRef.current = false;
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [current?.releaseId, refreshAccess, router]);

  return null;
}
