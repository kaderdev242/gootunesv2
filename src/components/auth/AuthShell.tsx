import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { images } from "@/lib/images";

export function AuthShell({
  title,
  subtitle,
  children,
  eyebrow = "Gootunes",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src={images.concertGreen}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/30" />
        <div className="absolute inset-0 violet-wash opacity-50 mix-blend-lighten" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <Logo size="md" />
          <p className="font-display mt-6 max-w-sm text-3xl font-bold leading-tight text-white">
            La musique africaine, vendue directement aux fans.
          </p>
          <p className="mt-3 max-w-sm text-sm text-white/55">
            Artistes, labels et fans — un seul endroit pour publier, acheter et
            soutenir.
          </p>
        </div>
      </div>

      <div className="violet-wash relative flex min-h-dvh items-center justify-center px-4 py-12 sm:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="line-grid absolute inset-0" />
          <div className="dot-grid absolute inset-0" />
        </div>

        <div className="relative z-10 w-full max-w-[440px]">
          <Link href="/" className="mb-8 flex justify-center lg:justify-start">
            <Logo size="md" priority />
          </Link>

          <div className="rounded-[32px] border border-white/10 bg-black/45 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/35 uppercase">
              {eyebrow}
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-white">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/50">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
