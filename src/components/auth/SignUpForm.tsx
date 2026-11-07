"use client";

import { useState } from "react";
import { CreatorSignUpForm } from "@/components/auth/CreatorSignUpForm";
import type { UserRole } from "@/lib/supabase/database.types";

const creatorRoles: {
  id: Extract<UserRole, "artist" | "label">;
  label: string;
  hint: string;
}[] = [
  { id: "artist", label: "Artiste", hint: "Je publie ma musique" },
  { id: "label", label: "Label", hint: "Je gère des artistes" },
];

export function SignUpForm({
  defaultRole = "artist",
}: {
  defaultRole?: UserRole;
}) {
  const initial =
    defaultRole === "label" || defaultRole === "artist" ? defaultRole : "artist";
  const [role, setRole] = useState<"artist" | "label">(initial);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {creatorRoles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            aria-pressed={role === r.id}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              role === r.id
                ? "border-white/40 bg-white/[0.08] text-white"
                : "border-white/[0.08] bg-[#161616] text-white/55 hover:text-white"
            }`}
          >
            <span className="block text-[15px] font-medium">{r.label}</span>
            <span className="mt-0.5 block text-[13px] text-white/45">{r.hint}</span>
          </button>
        ))}
      </div>

      <CreatorSignUpForm role={role} />
    </div>
  );
}
