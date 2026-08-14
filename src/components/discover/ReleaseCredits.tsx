"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

export type ReleaseCreditFields = {
  auteur?: string | null;
  compositeur?: string | null;
  producteur?: string | null;
};

function creditRows(
  credits: ReleaseCreditFields | null | undefined,
  featuring?: string | null,
) {
  return [
    { label: "Auteur", value: credits?.auteur?.trim() },
    { label: "Compositeur", value: credits?.compositeur?.trim() },
    { label: "Producteur", value: credits?.producteur?.trim() },
    { label: "Featuring", value: featuring?.trim() },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
}

export function ReleaseCredits({
  credits,
  featuring,
}: {
  credits?: ReleaseCreditFields | null;
  featuring?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rows = creditRows(credits, featuring);
  if (!rows.length) return null;

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition hover:border-white/18 hover:bg-white/[0.05]"
      >
        <span className="text-sm font-semibold text-white">Crédits</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          className={`text-white/50 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <dl className="mt-3 space-y-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[11px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm text-white/85">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
