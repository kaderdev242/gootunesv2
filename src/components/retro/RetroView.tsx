"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Download04Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { toJpeg } from "html-to-image";
import type { RetroData } from "@/lib/retro";
import type { RetroPeriod } from "@/lib/retro-periods";
import { RETRO_PERIODS } from "@/lib/retro-periods";
import {
  ConsoleHeader,
  SegmentedLinks,
  consoleButtonClass,
} from "@/components/admin/console/ui";
import { toastError } from "@/lib/toast";
import { buildRetroCards, CARD_H, CARD_W, type RetroCardDef, type RetroImages } from "./RetroCards";
import { hueFromImage, paletteFromHue, toDataUrl, type RetroPalette } from "./palette";

const STORY_MS = 6000;

function ScaledCard({
  card,
  width,
  nodeRef,
}: {
  card: RetroCardDef;
  width: number;
  nodeRef?: (el: HTMLDivElement | null) => void;
}) {
  const scale = width / CARD_W;
  return (
    <div style={{ width, height: CARD_H * scale, overflow: "hidden", position: "relative" }}>
      <div
        ref={nodeRef}
        style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {card.render()}
      </div>
    </div>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

async function exportJpeg(node: HTMLElement, filename: string) {
  const dataUrl = await toJpeg(node, {
    quality: 0.92,
    width: CARD_W,
    height: CARD_H,
    pixelRatio: 1,
    style: { transform: "none" },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function GalleryCard({
  card,
  register,
  onDownload,
  busy,
}: {
  card: RetroCardDef;
  register: (id: string, el: HTMLDivElement | null) => void;
  onDownload: (id: string) => void;
  busy: boolean;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  return (
    <figure className="space-y-3">
      <div ref={ref} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f10]">
        {width > 0 ? <ScaledCard card={card} width={width} nodeRef={(el) => register(card.id, el)} /> : <div className="aspect-[9/16]" />}
      </div>
      <figcaption className="flex items-center justify-between gap-3">
        <span className="truncate text-[14px] text-white/70">{card.title}</span>
        <button
          type="button"
          onClick={() => onDownload(card.id)}
          disabled={busy}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[13px] text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <HugeiconsIcon icon={Download04Icon} size={16} strokeWidth={1.8} />
          JPG
        </button>
      </figcaption>
    </figure>
  );
}

function StoryMode({
  cards,
  start,
  onClose,
  onDownload,
}: {
  cards: RetroCardDef[];
  start: number;
  onClose: () => void;
  onDownload: (id: string, node: HTMLElement | null) => void;
}) {
  const [index, setIndex] = useState(start);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0 });

  useEffect(() => {
    const fit = () => {
      const h = window.innerHeight - 120;
      const w = Math.min(window.innerWidth - 32, (h * CARD_W) / CARD_H, 520);
      setSize({ w: Math.floor(w) });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= cards.length - 1) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [cards.length, onClose]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const t = window.setTimeout(next, STORY_MS);
    return () => window.clearTimeout(t);
  }, [index, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [next, prev, onClose]);

  const card = cards[index];

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black" role="dialog" aria-label="Ma Rétro">
      <style>{`
        @keyframes retro-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes retro-in { from { opacity: 0; transform: translateY(16px) scale(.98) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .retro-in { animation: none !important } }
      `}</style>
      <div style={{ width: size.w }} className="mb-3 flex gap-1.5">
        {cards.map((c, i) => (
          <span key={c.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
            <span
              key={i === index ? `on-${index}` : "off"}
              className="block h-full origin-left bg-white"
              style={
                i < index
                  ? { transform: "scaleX(1)" }
                  : i === index
                    ? { animation: `retro-fill ${STORY_MS}ms linear forwards` }
                    : { transform: "scaleX(0)" }
              }
            />
          </span>
        ))}
      </div>

      <div className="relative" style={{ width: size.w }}>
        {size.w > 0 && card ? (
          <div key={card.id} className="retro-in overflow-hidden rounded-2xl" style={{ animation: "retro-in 420ms cubic-bezier(.2,.8,.2,1)" }}>
            <ScaledCard card={card} width={size.w} nodeRef={(el) => (nodeRef.current = el)} />
          </div>
        ) : null}
        <button type="button" aria-label="Carte précédente" onClick={prev} className="absolute inset-y-0 left-0 w-1/3" />
        <button type="button" aria-label="Carte suivante" onClick={next} className="absolute inset-y-0 right-0 w-2/3" />
      </div>

      <div style={{ width: size.w }} className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="button" onClick={prev} aria-label="Précédente" className="grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </button>
          <button type="button" onClick={next} aria-label="Suivante" className="grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15">
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => card && onDownload(card.id, nodeRef.current)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-medium text-black hover:bg-white/90"
        >
          <HugeiconsIcon icon={Download04Icon} size={16} strokeWidth={2} />
          Télécharger
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={18} />
      </button>
    </div>
  );
}

export function RetroView({
  data,
  period,
  basePath,
  name,
  avatar,
  isLabel,
}: {
  data: RetroData | null;
  period: RetroPeriod;
  basePath: string;
  name: string;
  avatar: string | null;
  isLabel: boolean;
}) {
  const [images, setImages] = useState<RetroImages>({});
  const [palette, setPalette] = useState<RetroPalette | null>(null);
  const [busy, setBusy] = useState(false);
  const [story, setStory] = useState<number | null>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());

  // Images en data URL (export fiable) + couleur tirée de la photo
  useEffect(() => {
    let cancelled = false;
    const srcs = new Set<string>();
    if (avatar) srcs.add(avatar);
    data?.topTracks.forEach((t) => t.cover && srcs.add(t.cover));
    data?.topArtists.forEach((a) => a.avatar && srcs.add(a.avatar));
    (async () => {
      const entries = await Promise.all([...srcs].map(async (s) => [s, await toDataUrl(s)] as const));
      if (cancelled) return;
      const map = Object.fromEntries(entries);
      setImages(map);
      let hue: number | null = null;
      const avatarData = avatar ? map[avatar] : null;
      if (avatarData) {
        try {
          hue = await hueFromImage(avatarData);
        } catch {
          hue = null;
        }
      }
      if (!cancelled) setPalette(paletteFromHue(hue));
    })();
    return () => {
      cancelled = true;
    };
  }, [avatar, data]);

  const cards = useMemo(
    () => (data && palette ? buildRetroCards({ data, palette, images, name, avatar, isLabel }) : []),
    [data, palette, images, name, avatar, isLabel],
  );

  const hasStats = Boolean(data && (data.plays > 0 || data.sales > 0 || data.totalPlays > 0));

  const filename = (id: string) => `gootunes-retro-${data?.periodLabel.replace(/\s+/g, "-").toLowerCase() ?? period}-${id}.jpg`;

  const download = async (id: string, node?: HTMLElement | null) => {
    const el = node ?? nodes.current.get(id);
    if (!el) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      await exportJpeg(el, filename(id));
    } catch {
      toastError("Impossible de créer l'image. Réessaie.");
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    setBusy(true);
    try {
      await document.fonts.ready;
      for (const card of cards) {
        const el = nodes.current.get(card.id);
        if (el) await exportJpeg(el, filename(card.id));
        await new Promise((r) => setTimeout(r, 350));
      }
    } catch {
      toastError("Impossible de créer les images. Réessaie.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConsoleHeader
        title="Rétro"
        description="Ton récap en cartes, aux couleurs de ta photo de profil. Télécharge-les en JPG et partage-les en story."
        actions={
          hasStats && cards.length ? (
            <>
              <button type="button" onClick={() => setStory(0)} className={consoleButtonClass("ghost")}>
                <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={1.8} />
                Lancer la Rétro
              </button>
              <button type="button" onClick={downloadAll} disabled={busy} className={consoleButtonClass("primary")}>
                <HugeiconsIcon icon={Download04Icon} size={16} strokeWidth={2} />
                {busy ? "Création…" : "Tout télécharger"}
              </button>
            </>
          ) : null
        }
      />

      <SegmentedLinks
        value={period}
        options={RETRO_PERIODS.map((p) => ({
          value: p.value,
          label: p.label,
          href: `${basePath}/retro${p.value === "annee" ? "" : `?periode=${p.value}`}`,
        }))}
      />

      {!data ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f10] px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-white">Ta Rétro n&apos;a pas pu être calculée</p>
          <p className="mt-1 text-[14px] text-white/50">Réessaie dans quelques instants.</p>
        </div>
      ) : !hasStats ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f10] px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-white">Pas encore de Rétro sur cette période</p>
          <p className="mt-1 text-[14px] text-white/50">
            Elle se remplira dès tes premières écoutes et tes premières ventes.
          </p>
        </div>
      ) : !palette ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[9/16] animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <GalleryCard
              key={card.id}
              card={card}
              busy={busy}
              onDownload={(id) => download(id)}
              register={(id, el) => {
                if (el) nodes.current.set(id, el);
                else nodes.current.delete(id);
              }}
            />
          ))}
        </div>
      )}

      {story !== null && cards.length ? (
        <StoryMode cards={cards} start={story} onClose={() => setStory(null)} onDownload={(id, node) => download(id, node)} />
      ) : null}
    </div>
  );
}
