"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { DashboardSidebar } from "./DashboardSidebar";
import type { CreatorBase } from "@/lib/dashboard/paths";
import type { Profile } from "@/lib/supabase/database.types";

export function DashboardShell({
  profile,
  basePath,
  children,
}: {
  profile: Profile;
  basePath: CreatorBase;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="violet-wash absolute inset-0" />
      </div>

      <DashboardSidebar
        profile={profile}
        basePath={basePath}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/8 bg-black/40 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Button
            isIconOnly
            variant="ghost"
            className="text-white"
            aria-label="Menu"
            onPress={() => setOpen((v) => !v)}
          >
            <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={20} />
          </Button>
          <span className="text-sm font-semibold tracking-wide">
            {basePath === "/label" ? "Label" : "Artiste"}
          </span>
          <span className="size-10" />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
