"use client";

import Image from "next/image";
import { Card } from "@heroui/react";
import { images } from "@/lib/images";

export function OpportunitiesSection() {
  return (
    <section id="vendre" className="w-full scroll-mt-8 px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-display">
            <span className="block text-2xl font-medium text-white/45 sm:text-3xl">
              Pour les artistes
            </span>
            <span className="mt-1 block text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Publiez. Vendez. Encaissez.
            </span>
          </h2>
          <p className="font-display mt-6 text-xl font-semibold text-white sm:text-2xl">
            Votre musique, vos fans, vos revenus — sans passer par un label
            obligatoire.
          </p>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/60 sm:text-base">
            <p>
              Gootunes vous donne les outils d&apos;une plateforme de streaming,
              avec la liberté d&apos;un Direct-to-Fan : publiez albums et
              singles, soyez découverts, et recevez 80&nbsp;% de chaque vente.
            </p>
            <p>
              Paiement Mobile Money adapté à l&apos;Afrique — Congo, RDC, Côte
              d&apos;Ivoire, Cameroun, Sénégal et plus encore.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="violet-card relative overflow-hidden rounded-[24px] border border-white/10">
            <div className="pointer-events-none absolute inset-0 opacity-25">
              <div className="line-grid absolute inset-0" />
            </div>
            <div className="relative grid sm:grid-cols-[1.2fr_0.9fr]">
              <div className="p-6">
                <Card.Header className="p-0">
                  <Card.Title className="font-display text-lg text-white">
                    Albums & singles sur Discover
                  </Card.Title>
                  <Card.Description className="mt-2 text-sm leading-relaxed text-white/55">
                    Mettez vos sorties devant des fans qui cherchent de la
                    musique africaine — tendances, nouveautés, genres et
                    playlists.
                  </Card.Description>
                </Card.Header>
              </div>
              <div className="relative flex min-h-[180px] items-center justify-center bg-black/30 p-4">
                <div className="relative flex flex-col items-center gap-3">
                  <div className="relative size-16 overflow-hidden rounded-xl ring-2 ring-white/50">
                    <Image
                      src={images.artistVs1}
                      alt="Artiste"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <span className="font-display text-sm font-bold tracking-widest text-white/80 uppercase">
                    Live
                  </span>
                  <div className="relative size-16 overflow-hidden rounded-xl ring-2 ring-white/30">
                    <Image
                      src={images.artistVs2}
                      alt="Artiste"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="violet-card relative overflow-hidden rounded-[24px] border border-white/10">
            <div className="pointer-events-none absolute inset-0 opacity-25">
              <div className="line-grid absolute inset-0" />
            </div>
            <div className="relative grid sm:grid-cols-[1.2fr_0.9fr]">
              <div className="p-6">
                <Card.Header className="p-0">
                  <Card.Title className="font-display text-lg text-white">
                    Paiement Mobile Money
                  </Card.Title>
                  <Card.Description className="mt-2 text-sm leading-relaxed text-white/55">
                    Les fans achètent en un clic. Vous retirez vos revenus
                    simplement — pensé pour les usages locaux.
                  </Card.Description>
                </Card.Header>
              </div>
              <div className="relative min-h-[180px] overflow-hidden">
                <Image
                  src={images.liveEvent}
                  alt="Ambiance musicale"
                  fill
                  className="object-cover"
                  sizes="280px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-950/80 via-transparent to-transparent" />
                <div className="absolute inset-x-3 bottom-3">
                  <p className="font-display text-sm font-bold tracking-wide text-white">
                    NOUVELLE SORTIE
                  </p>
                  <p className="mt-1 text-[11px] text-white/70">
                    Single · 1 500 FCFA · Abidjan
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
