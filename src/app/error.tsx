"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { reportClientError } from "@/lib/system-log-client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app.error]", error);
    reportClientError({
      source: "boundary",
      message: error.message || "Erreur React",
      stack: error.stack || null,
      digest: error.digest || null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
    });
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#121212] px-6 text-center text-white">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-white/35 uppercase">
        Gootunes
      </p>
      <h1 className="font-display mt-4 text-3xl font-bold sm:text-4xl">
        Une erreur est survenue
      </h1>
      <p className="mt-3 max-w-md text-sm text-white/50">
        Quelque chose s&apos;est mal passé. Tu peux réessayer, ou revenir à
        l&apos;accueil.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          onPress={reset}
          className="rounded-full bg-white px-6 font-semibold text-black"
        >
          Réessayer
        </Button>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
