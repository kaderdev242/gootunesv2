import { Logo } from "@/components/landing/Logo";
import { signOut } from "@/lib/actions/auth";
import { contactInbox } from "@/lib/email/client";

export default function CompteSuspenduPage() {
  const support = contactInbox();

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="violet-wash absolute inset-0" />
      </div>
      <div className="relative z-10 max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-red-300/80 uppercase">
            Accès bloqué
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ton compte est suspendu
          </h1>
          <p className="text-sm leading-relaxed text-white/60">
            Tu ne peux plus accéder à Gootunes pour le moment. Si tu penses
            qu&apos;il s&apos;agit d&apos;une erreur, contacte le support :
          </p>
          <a
            href={`mailto:${support}`}
            className="inline-flex text-sm font-medium text-white underline underline-offset-4"
          >
            {support}
          </a>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
