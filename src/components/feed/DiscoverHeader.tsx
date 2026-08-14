"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { signOut } from "@/lib/actions/auth";
import { creatorHome } from "@/lib/dashboard/paths";
import type { Profile } from "@/lib/supabase/database.types";
import { DiscoverSearchBar } from "@/components/discover/DiscoverSearchBar";
import { FanAuthModal } from "./FanAuthModal";

export function DiscoverHeader({ profile }: { profile: Profile | null }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");

  function openAuth(mode: "signup" | "signin") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#121212]/92 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="hidden min-w-0 shrink-0 md:block md:max-w-[200px] lg:max-w-[260px]">
            <p className="truncate text-sm font-medium text-white/80">
              {profile
                ? `Salut, ${profile.display_name?.trim() || profile.email?.split("@")[0] || "fan"}`
                : "Explore la musique"}
            </p>
            <p className="truncate text-xs text-white/35">
              {profile
                ? profile.role === "fan"
                  ? "Ta bibliothèque t’attend"
                  : "Compte créateur connecté"
                : "Achete & sauvegarde tes sons"}
            </p>
          </div>

          <div className="mx-auto w-full max-w-[min(100%,20rem)] min-w-0 flex-1 sm:mx-0 sm:max-w-sm md:max-w-md">
            <DiscoverSearchBar className="w-full" compact />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {profile ? (
              <>
                {(profile.role === "artist" || profile.role === "label") && (
                  <Link
                    href={creatorHome(profile.role)}
                    className="hidden h-9 items-center rounded-full border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/10 sm:inline-flex"
                  >
                    Mon espace
                  </Link>
                )}
                <form action={signOut}>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 rounded-full bg-white/10 px-3 font-medium text-white sm:px-4"
                  >
                    Déconnexion
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden h-9 rounded-full px-3 text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex"
                  onPress={() => openAuth("signin")}
                >
                  Connexion
                </Button>
                <Button
                  size="sm"
                  className="h-9 rounded-full bg-white px-3 font-semibold text-black sm:px-4"
                  onPress={() => openAuth("signup")}
                >
                  Compte fan
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <FanAuthModal
        isOpen={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
      />
    </>
  );
}
