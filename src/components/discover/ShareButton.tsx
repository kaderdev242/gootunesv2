"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Facebook02Icon,
  NewTwitterIcon,
  Share08Icon,
  TelegramIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { toastError, toastSuccess } from "@/lib/toast";
import { MediaModal } from "@/components/ui/MediaModal";
import { IconAction } from "./IconAction";

/**
 * Partage : action en icône (par défaut) ou rond seul (`circle`).
 * Ouvre une fenêtre au style Gootunes avec la pochette.
 */
export function ShareButton({
  title,
  path,
  cover,
  variant = "action",
}: {
  title: string;
  path: string;
  cover?: string | null;
  variant?: "action" | "circle";
  /** Conservé pour compatibilité. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(path);

  useEffect(() => {
    setUrl(new URL(path, window.location.origin).toString());
  }, [path]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toastSuccess("Lien copié");
    } catch {
      toastError("Impossible de copier le lien");
    }
  }

  const networks = [
    { label: "WhatsApp", icon: WhatsappIcon, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: "Facebook", icon: Facebook02Icon, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "X", icon: NewTwitterIcon, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { label: "Telegram", icon: TelegramIcon, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  ];

  return (
    <>
      {variant === "circle" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Partager"
          title="Partager"
          className="flex size-12 items-center justify-center rounded-full bg-white/[0.1] text-white transition-[background-color,transform] duration-150 hover:bg-white/[0.16] active:scale-[0.95]"
        >
          <HugeiconsIcon icon={Share08Icon} size={20} strokeWidth={1.75} />
        </button>
      ) : (
        <IconAction icon={Share08Icon} label="Partager" onClick={() => setOpen(true)} />
      )}

      <MediaModal open={open} onClose={() => setOpen(false)} cover={cover} title={`Partager « ${title} »`} description="Envoie le lien à tes proches ou sur tes réseaux">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="mx-auto flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.98]"
        >
          <HugeiconsIcon icon={Copy01Icon} size={18} strokeWidth={1.75} />
          Copier le lien
        </button>
        <div className="mt-6 flex justify-center gap-3">
          {networks.map((n) => (
            <button
              key={n.label}
              type="button"
              onClick={() => window.open(n.href, "_blank", "noopener,noreferrer")}
              aria-label={`Partager sur ${n.label}`}
              title={n.label}
              className="flex size-11 items-center justify-center rounded-full bg-white/[0.1] text-white transition-colors hover:bg-white/[0.18]"
            >
              <HugeiconsIcon icon={n.icon} size={18} strokeWidth={1.75} />
            </button>
          ))}
        </div>
        <p className="mt-6 truncate font-mono text-[12px] text-white/40">{url}</p>
      </MediaModal>
    </>
  );
}
