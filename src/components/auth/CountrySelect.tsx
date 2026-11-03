"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { COUNTRIES, type CountryCode } from "@/lib/constants";
import { CountryFlag } from "./CountryFlag";

export function CountrySelect({
  name = "country",
  value,
  onChange,
  id,
}: {
  name?: string;
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 text-left text-base text-white outline-none transition hover:bg-white/[0.07] focus-visible:border-white/30"
      >
        <CountryFlag code={selected.code} title={selected.label} />
        <span className="flex-1 font-medium">{selected.label}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          className={`text-white/40 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-white/12 bg-[#141414] p-1.5 shadow-2xl shadow-black/50"
        >
          {COUNTRIES.map((c) => {
            const active = c.code === value;
            return (
              <li key={c.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <CountryFlag code={c.code} title={c.label} />
                  <span className="font-medium">{c.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
