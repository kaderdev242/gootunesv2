"use client";

import { useEffect } from "react";

/**
 * Enregistre le SW en prod uniquement.
 * updateViaCache: 'none' + skipWaiting → mises à jour rapides, données réseau.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration | null = null;

    function checkUpdate() {
      void reg?.update();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") checkUpdate();
    }

    async function register() {
      try {
        reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        window.addEventListener("focus", checkUpdate);
        document.addEventListener("visibilitychange", onVisibility);

        reg.addEventListener("updatefound", () => {
          const worker = reg?.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch (err) {
        console.warn("[pwa] registration failed", err);
      }
    }

    void register();

    return () => {
      window.removeEventListener("focus", checkUpdate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
