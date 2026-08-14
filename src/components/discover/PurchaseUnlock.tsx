"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/components/feed/PlayerProvider";

/** Après un achat, passe le titre en cours en écoute full (une seule fois). */
export function PurchaseUnlock({ releaseId }: { releaseId: string }) {
  const { current, accessMode, refreshAccess } = usePlayer();
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    if (current?.releaseId !== releaseId) return;
    if (accessMode === "full") {
      doneRef.current = true;
      return;
    }
    doneRef.current = true;
    void refreshAccess();
  }, [accessMode, current?.releaseId, refreshAccess, releaseId]);

  return null;
}
