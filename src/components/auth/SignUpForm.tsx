"use client";

import Link from "next/link";
import { useState } from "react";
import { CreatorSignUpForm } from "@/components/auth/CreatorSignUpForm";
import type { UserRole } from "@/lib/supabase/database.types";

const creatorRoles: {
  id: Extract<UserRole, "artist" | "label">;
  label: string;
  hint: string;
}[] = [
  { id: "artist", label: "Artiste", hint: "Indépendant" },
  { id: "label", label: "Label", hint: "Catalogue" },
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
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2">
        {creatorRoles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={`rounded-2xl border px-3 py-3.5 text-center transition ${
              role === r.id
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/10"
            }`}
          >
            <span className="block text-sm font-semibold">{r.label}</span>
            <span className="mt-0.5 block text-[11px] opacity-70">{r.hint}</span>
          </button>
        ))}
      </div>

      <CreatorSignUpForm role={role} />

      <p className="text-center text-sm text-white/45">
        Tu es fan ?{" "}
        <Link
          href="/"
          className="text-white underline-offset-2 hover:underline"
        >
          Inscris-toi depuis Discover
        </Link>
      </p>
      <p className="text-center text-sm text-white/45">
        Déjà inscrit ?{" "}
        <Link
          href="/connexion"
          className="text-white underline-offset-2 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
