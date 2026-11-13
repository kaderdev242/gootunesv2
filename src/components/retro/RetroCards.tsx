"use client";

import type { CSSProperties, ReactNode } from "react";
import type { RetroData } from "@/lib/retro";
import { getCountryLabel, COUNTRIES, type CountryCode } from "@/lib/constants";
import { CountryFlag } from "@/components/auth/CountryFlag";
import type { RetroPalette, RetroScheme } from "./palette";

/** Toutes les cartes sont dessinées en 1080 × 1920 (format story) puis mises à l'échelle. */
export const CARD_W = 1080;
export const CARD_H = 1920;

export type RetroImages = Record<string, string | null>;

export type RetroCardDef = {
  id: string;
  title: string;
  render: () => ReactNode;
};

const display: CSSProperties = {
  fontFamily: "var(--font-syne), sans-serif",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 0.95,
};

const nf = new Intl.NumberFormat("fr-FR");
const fmt = (n: number) => nf.format(Math.round(n)).replace(/ /g, " ");
const money = (n: number) => `${fmt(n)} FCFA`;

const DAYS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function isKnownCountry(code: string): code is CountryCode {
  return COUNTRIES.some((c) => c.code === code);
}

/* ─────────────── Décor : rubans de « lignes de son » ─────────────── */

function Ribbon({
  a,
  b,
  y,
  flip = false,
  seed = 0,
  lines = 30,
}: {
  a: string;
  b: string;
  y: number;
  flip?: boolean;
  seed?: number;
  lines?: number;
}) {
  const id = `rg-${seed}-${y}-${flip ? 1 : 0}`;
  const paths = Array.from({ length: lines }, (_, i) => {
    const o = i * 15;
    const w = Math.sin(seed + i * 0.18) * 40;
    return `M -120 ${o + 40} C 260 ${o - 220 + w}, 620 ${o + 360 - w}, 1200 ${o * 0.55 + 60}`;
  });
  return (
    <svg
      width={CARD_W}
      height={640}
      viewBox={`0 0 ${CARD_W} 640`}
      style={{
        position: "absolute",
        left: 0,
        top: y,
        transform: flip ? "scale(-1, -1)" : undefined,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#${id})`} strokeWidth={9} strokeLinecap="round" />
      ))}
    </svg>
  );
}

/* ─────────────── Cadre commun ─────────────── */

function Frame({
  s,
  children,
  ribbons = "top",
  seed = 1,
}: {
  s: RetroScheme;
  children: ReactNode;
  ribbons?: "top" | "bottom" | "both" | "none";
  seed?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        overflow: "hidden",
        background: s.bg,
        color: s.ink,
        fontFamily: "var(--font-outfit), sans-serif",
      }}
    >
      {ribbons === "top" || ribbons === "both" ? (
        <Ribbon a={s.ribbonA} b={s.ribbonB} y={-120} seed={seed} />
      ) : null}
      {ribbons === "bottom" || ribbons === "both" ? (
        <Ribbon a={s.ribbonB} b={s.ribbonA} y={1180} flip seed={seed + 3} />
      ) : null}
      <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={s.logo === "light" ? "/logo-gootunes.png" : "/logo-gootunes-dark.png"}
          alt="Gootunes"
          style={{ height: 62, width: "auto" }}
        />
        <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "0.01em" }}>gootunes.com</span>
      </div>
    </div>
  );
}

function Center({ top, children }: { top: number; children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        right: 90,
        top,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children, s }: { children: ReactNode; s: RetroScheme }) {
  return <p style={{ fontSize: 46, fontWeight: 600, color: s.ink, margin: 0 }}>{children}</p>;
}

function Cover({ src, size, radius = 6, label }: { src: string | null; size: number; radius?: number; label: string }) {
  if (!src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: "rgba(127,127,127,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: size * 0.4,
          flex: "none",
        }}
      >
        {label.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: radius,
        flex: "none",
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
      }}
    />
  );
}

/* ─────────────── Construction des cartes ─────────────── */

export function buildRetroCards({
  data,
  palette: p,
  images,
  name,
  avatar,
  isLabel,
}: {
  data: RetroData;
  palette: RetroPalette;
  images: RetroImages;
  name: string;
  avatar: string | null;
  isLabel: boolean;
}): RetroCardDef[] {
  const cards: RetroCardDef[] = [];
  const year = data.periodLabel;
  const img = (src: string | null) => (src ? (images[src] ?? null) : null);
  const delta =
    data.playsPrev && data.playsPrev > 0
      ? Math.round(((data.plays - data.playsPrev) / data.playsPrev) * 100)
      : null;

  // 1. Couverture
  cards.push({
    id: "intro",
    title: "Couverture",
    render: () => (
      <Frame s={p.dark} ribbons="both" seed={2}>
        <Center top={470}>
          <Cover src={img(avatar)} size={460} radius={999} label={name} />
          <p style={{ ...display, fontSize: 120, margin: "80px 0 0" }}>Ma Rétro</p>
          <p style={{ ...display, fontSize: data.period === "tout" ? 96 : 120, margin: "6px 0 0", color: p.dark.ribbonA }}>{data.period === "tout" ? "depuis mes débuts" : year}</p>
          <p style={{ fontSize: 50, fontWeight: 500, margin: "50px 0 0", color: p.dark.muted }}>{name}</p>
        </Center>
      </Frame>
    ),
  });

  // 2. Écoutes
  if (data.plays > 0) {
    const best = data.bestDay?.date
      ? new Date(`${data.bestDay.date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
      : null;
    cards.push({
      id: "ecoutes",
      title: "Mes écoutes",
      render: () => (
        <Frame s={p.dark} ribbons="bottom" seed={5}>
          <Center top={420}>
            <Kicker s={p.dark}>Mes écoutes</Kicker>
            <p style={{ ...display, fontSize: data.plays >= 100000 ? 210 : 260, margin: "70px 0 0" }}>{fmt(data.plays)}</p>
            <p style={{ fontSize: 44, lineHeight: 1.35, margin: "80px 0 0", color: p.dark.muted, maxWidth: 820 }}>
              Par <b style={{ color: p.dark.ink }}>{fmt(data.listeners)}</b> auditeur{data.listeners > 1 ? "s" : ""}
              {data.countriesCount > 1 ? (
                <>
                  {" "}dans <b style={{ color: p.dark.ink }}>{data.countriesCount}</b> pays
                </>
              ) : null}
              .
            </p>
            {best && data.bestDay ? (
              <p style={{ fontSize: 44, lineHeight: 1.35, margin: "36px 0 0", color: p.dark.muted, maxWidth: 820 }}>
                Mon plus beau jour ? Le <b style={{ color: p.dark.ink }}>{best}</b>, avec{" "}
                <b style={{ color: p.dark.ink }}>{fmt(data.bestDay.plays)}</b> écoutes.
              </p>
            ) : null}
            {delta !== null ? (
              <p style={{ fontSize: 44, margin: "36px 0 0", color: p.dark.muted }}>
                <b style={{ color: p.dark.ink }}>
                  {delta > 0 ? "+" : ""}
                  {delta}&nbsp;%
                </b>{" "}
                par rapport à la période précédente
              </p>
            ) : null}
          </Center>
        </Frame>
      ),
    });
  }

  // 3. Classement des titres
  if (data.topTracks.length > 1) {
    cards.push({
      id: "classement",
      title: "Mes titres les plus écoutés",
      render: () => (
        <Frame s={p.vivid} ribbons="top" seed={8}>
          <div style={{ position: "absolute", left: 90, right: 90, top: 470 }}>
            <Kicker s={p.vivid}>Mes titres les plus écoutés</Kicker>
            <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 34 }}>
              {data.topTracks.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 40 }}>
                  <span style={{ ...display, fontSize: 92, width: 110 }}>{i + 1}</span>
                  <Cover src={img(t.cover)} size={170} label={t.title} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 46, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.title}
                    </p>
                    <p style={{ fontSize: 36, margin: "8px 0 0", color: p.vivid.muted }}>{fmt(t.plays)} écoutes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Frame>
      ),
    });
  }

  // 4. Le titre n°1
  const top = data.topTracks[0];
  if (top) {
    cards.push({
      id: "titre",
      title: "Mon titre n°1",
      render: () => (
        <Frame s={p.light} ribbons="top" seed={11}>
          <Center top={330}>
            <Cover src={img(top.cover)} size={620} label={top.title} />
            <p style={{ fontSize: 46, fontWeight: 600, margin: "90px 0 0" }}>Mon titre le plus écouté</p>
            <p style={{ ...display, fontSize: 104, margin: "34px 0 0", maxWidth: 900 }}>{top.title}</p>
            {top.releaseTitle && top.releaseTitle !== top.title ? (
              <p style={{ fontSize: 44, margin: "22px 0 0", color: p.light.muted }}>{top.releaseTitle}</p>
            ) : null}
            <p style={{ fontSize: 40, margin: "60px 0 0", color: p.light.muted }}>Écoutes</p>
            <p style={{ ...display, fontSize: 90, margin: "10px 0 0" }}>{fmt(top.plays)}</p>
          </Center>
        </Frame>
      ),
    });
  }

  // 5. Pays
  const countries = data.topCountries.filter((c) => c.country);
  if (countries.length > 0) {
    const sum = countries.reduce((acc, c) => acc + c.plays, 0);
    cards.push({
      id: "pays",
      title: "Là où on m'écoute",
      render: () => (
        <Frame s={p.alt} ribbons="bottom" seed={14}>
          <div style={{ position: "absolute", left: 90, right: 90, top: 380 }}>
            <Kicker s={p.alt}>Là où on m&apos;écoute</Kicker>
            <div style={{ marginTop: 90, display: "flex", flexDirection: "column", gap: 70 }}>
              {countries.map((c, i) => {
                const share = data.plays > 0 ? Math.round((c.plays / data.plays) * 100) : Math.round((c.plays / sum) * 100);
                return (
                  <div key={c.country} style={{ display: "flex", alignItems: "center", gap: 44 }}>
                    <span style={{ ...display, fontSize: 92, width: 90 }}>{i + 1}</span>
                    {isKnownCountry(c.country) ? (
                      <span style={{ width: 150, height: 100, borderRadius: 14, overflow: "hidden", display: "flex", flex: "none" }}>
                        <CountryFlag code={c.country} className="h-full w-full" />
                      </span>
                    ) : null}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...display, fontSize: 70, margin: 0 }}>{getCountryLabel(c.country)}</p>
                      <p style={{ fontSize: 38, margin: "10px 0 0", color: p.alt.muted }}>
                        {share}&nbsp;% de mes écoutes
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Frame>
      ),
    });
  }

  // 6. Mon moment
  const peakDow = data.peakDow;
  const peakHour = data.peakHour;
  if (peakDow && peakHour !== null) {
    cards.push({
      id: "moment",
      title: "Mon moment",
      render: () => (
        <Frame s={p.dark} ribbons="top" seed={17}>
          <Center top={620}>
            <Kicker s={p.dark}>Mes fans m&apos;écoutent surtout le</Kicker>
            <p style={{ ...display, fontSize: 190, margin: "60px 0 0", color: p.dark.ribbonA }}>{DAYS[peakDow]}</p>
            <p style={{ ...display, fontSize: 130, margin: "30px 0 0" }}>vers {peakHour}&nbsp;h</p>
          </Center>
        </Frame>
      ),
    });
  }

  // 7. Label : artistes du catalogue
  if (isLabel && data.topArtists.length > 1) {
    cards.push({
      id: "artistes",
      title: "Mes artistes les plus écoutés",
      render: () => (
        <Frame s={p.vivid} ribbons="bottom" seed={20}>
          <div style={{ position: "absolute", left: 90, right: 90, top: 300 }}>
            <Kicker s={p.vivid}>Mes artistes les plus écoutés</Kicker>
            <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 34 }}>
              {data.topArtists.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 40 }}>
                  <span style={{ ...display, fontSize: 92, width: 110 }}>{i + 1}</span>
                  <Cover src={img(a.avatar)} size={170} radius={999} label={a.name} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 48, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.name}
                    </p>
                    <p style={{ fontSize: 36, margin: "8px 0 0", color: p.vivid.muted }}>{fmt(a.plays)} écoutes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Frame>
      ),
    });
  }

  // 8. Ventes
  if (data.sales > 0) {
    cards.push({
      id: "ventes",
      title: "Mes ventes",
      render: () => (
        <Frame s={p.vivid} ribbons="top" seed={23}>
          <Center top={520}>
            <Kicker s={p.vivid}>Mes ventes</Kicker>
            <p style={{ ...display, fontSize: 260, margin: "60px 0 0" }}>{fmt(data.sales)}</p>
            <p style={{ fontSize: 44, margin: "20px 0 0", color: p.vivid.muted }}>achat{data.sales > 1 ? "s" : ""} de ma musique</p>
            <p style={{ fontSize: 40, margin: "90px 0 0", color: p.vivid.muted }}>Revenus nets</p>
            <p style={{ ...display, fontSize: 104, margin: "14px 0 0" }}>{money(data.net)}</p>
            {data.topRelease ? (
              <p style={{ fontSize: 42, lineHeight: 1.35, margin: "70px 0 0", color: p.vivid.muted, maxWidth: 840 }}>
                Ma sortie la plus achetée : <b style={{ color: p.vivid.ink }}>{data.topRelease.title}</b>
              </p>
            ) : null}
          </Center>
        </Frame>
      ),
    });
  }

  // 9. Total accumulé
  if (data.totalNet > 0 || data.totalPlays > 0) {
    cards.push({
      id: "total",
      title: "Mon total",
      render: () => (
        <Frame s={p.dark} ribbons="both" seed={26}>
          <div style={{ position: "absolute", left: 90, right: 90, top: 560 }}>
            <Kicker s={p.dark}>Depuis mes débuts sur Gootunes</Kicker>
            <p style={{ fontSize: 40, margin: "70px 0 0", color: p.dark.muted }}>Total gagné</p>
            <p style={{ ...display, fontSize: 130, margin: "16px 0 0", color: p.dark.ribbonA }}>{money(data.totalNet)}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 70, marginTop: 90 }}>
              <div>
                <p style={{ fontSize: 38, margin: 0, color: p.dark.muted }}>Écoutes</p>
                <p style={{ ...display, fontSize: 86, margin: "12px 0 0" }}>{fmt(data.totalPlays)}</p>
              </div>
              {data.newFollowers > 0 ? (
                <div>
                  <p style={{ fontSize: 38, margin: 0, color: p.dark.muted }}>Abonnés · {year}</p>
                  <p style={{ ...display, fontSize: 86, margin: "12px 0 0" }}>{fmt(data.newFollowers)}</p>
                </div>
              ) : null}
              {data.favorites > 0 ? (
                <div>
                  <p style={{ fontSize: 38, margin: 0, color: p.dark.muted }}>Favoris · {year}</p>
                  <p style={{ ...display, fontSize: 86, margin: "12px 0 0" }}>{fmt(data.favorites)}</p>
                </div>
              ) : null}
            </div>
          </div>
        </Frame>
      ),
    });
  }

  return cards;
}
