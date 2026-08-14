"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

export function DiscoverSearch({
  basePath = "/discover/recherche",
  placeholder = "Rechercher un titre, artiste ou genre…",
}: {
  basePath?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(params.get("q") || "");

  useEffect(() => {
    setValue(params.get("q") || "");
  }, [params]);

  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        const next = q
          ? `${basePath}?q=${encodeURIComponent(q)}`
          : basePath;
        startTransition(() => router.push(next));
      }}
    >
      <HugeiconsIcon
        icon={Search01Icon}
        size={18}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-white/35"
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-full border border-white/10 bg-white/[0.04] pr-4 pl-11 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
        aria-label="Recherche"
      />
      {pending ? (
        <span className="absolute top-1/2 right-4 -translate-y-1/2 text-[11px] text-white/35">
          …
        </span>
      ) : null}
    </form>
  );
}
