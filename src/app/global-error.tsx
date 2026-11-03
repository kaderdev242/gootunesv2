"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global.error]", error);
    const body = JSON.stringify({
      source: "global-boundary",
      message: error.message || "Erreur critique",
      stack: error.stack || null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      digest: error.digest || null,
    });
    try {
      void fetch("/api/system-log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      });
    } catch {
      /* ignore */
    }
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121212",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <p style={{ letterSpacing: "0.2em", fontSize: 11, opacity: 0.4 }}>
            GOOTUNES
          </p>
          <h1 style={{ fontSize: 28, margin: "16px 0 8px" }}>
            Erreur critique
          </h1>
          <p style={{ opacity: 0.55, fontSize: 14, maxWidth: 360 }}>
            L&apos;application a rencontré un problème. Réessaie.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              border: 0,
              borderRadius: 999,
              background: "#fff",
              color: "#111",
              fontWeight: 600,
              padding: "12px 22px",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
