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
      <header className="sticky top-0 z-20 bg-black/85 px-4 py-3 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="mx-auto w-full max-w-[min(100%,22rem)] min-w-0 flex-1 sm:mx-0 sm:max-w-sm md:max-w-md">
            <DiscoverSearchBar className="w-full" compact />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {profile ? (
              profile.role === "artist" || profile.role === "label" ? (
                <Link
                  href={creatorHome(profile.role)}
                  className="inline-flex h-9 items-center rounded-full bg-[#1a1a1a] px-3.5 text-sm font-medium text-white transition hover:bg-white/10 sm:px-4"
                >
                  Mon espace
                </Link>
              ) : (
                <form action={signOut}>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 rounded-full bg-[#1a1a1a] px-3 font-medium text-white sm:px-4"
                  >
                    Déconnexion
                  </Button>
                </form>
              )
            ) : (
              <>
                {/* Mobile : Se connecter uniquement */}
                <Button
                  size="sm"
                  className="h-9 rounded-full bg-white px-3.5 font-semibold text-black sm:hidden"
                  onPress={() => openAuth("signin")}
                >
                  Se connecter
                </Button>
                {/* Desktop : connexion + inscription */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden h-9 rounded-full px-4 text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
                  onPress={() => openAuth("signin")}
                >
                  Se connecter
                </Button>
                <Button
                  size="sm"
                  className="hidden h-9 rounded-full bg-white px-4 font-semibold text-black sm:inline-flex"
                  onPress={() => openAuth("signup")}
                >
                  Créer un compte
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
