"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Facebook02Icon,
  Link01Icon,
  NewTwitterIcon,
  Share01Icon,
  TelegramIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { toastError, toastSuccess } from "@/lib/toast";

export function ShareButton({
  title,
  path,
  compact = false,
}: {
  title: string;
  path: string;
  compact?: boolean;
}) {
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

  function openShare(shareUrl: string) {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Modal>
      <Button
        type="button"
        variant="ghost"
        aria-label="Partager"
        className={
          compact
            ? "hidden size-12 rounded-full border border-white/15 bg-white/5 text-white sm:inline-flex"
            : "hidden h-11 rounded-full border border-white/15 bg-white/5 px-5 text-white sm:inline-flex"
        }
      >
        <HugeiconsIcon icon={Share01Icon} size={16} />
        {compact ? null : <span className="ml-2">Partager</span>}
      </Button>
      <Modal.Backdrop className="bg-black/70">
        <Modal.Container className="px-4">
          <Modal.Dialog className="rounded-[28px] border border-white/12 bg-[#111] text-white sm:max-w-[400px]">
            <Modal.CloseTrigger className="text-white/50" />
            <Modal.Header>
              <Modal.Heading className="font-display text-xl font-bold">
                Partager
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="line-clamp-2 text-sm text-white/50">{title}</p>

              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
              >
                <span className="grid size-10 place-items-center rounded-full bg-white/10">
                  <HugeiconsIcon icon={Copy01Icon} size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Copier le lien</span>
                  <span className="block text-xs text-white/40">
                    Partage-le où tu veux
                  </span>
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "WhatsApp",
                    icon: WhatsappIcon,
                    href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
                  },
                  {
                    label: "Facebook",
                    icon: Facebook02Icon,
                    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                  },
                  {
                    label: "X",
                    icon: NewTwitterIcon,
                    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
                  },
                  {
                    label: "Telegram",
                    icon: TelegramIcon,
                    href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => openShare(item.href)}
                    className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm font-medium transition hover:bg-white/8"
                  >
                    <HugeiconsIcon icon={item.icon} size={18} />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-white/8 bg-black/30 px-3 py-2.5 text-xs text-white/40">
                <HugeiconsIcon
                  icon={Link01Icon}
                  size={14}
                  className="mt-0.5 shrink-0"
                />
                <span className="break-all">{url}</span>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
