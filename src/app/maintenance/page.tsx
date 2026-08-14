import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/landing/Logo";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  let message = "Gootunes est en maintenance. Reviens bientôt.";

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("maintenance_message, maintenance_enabled")
      .eq("id", 1)
      .maybeSingle();
    if (data?.maintenance_message) message = data.maintenance_message;
  } catch {
    // ignore
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="violet-wash absolute inset-0 opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>
      <div className="relative z-10 max-w-lg space-y-8 text-center">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-amber-200/70 uppercase">
            Maintenance en cours
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            On revient tout de suite
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-white/55">
            {message}
          </p>
        </div>
        <p className="text-xs text-white/30">
          L&apos;accès public est temporairement indisponible.
        </p>
      </div>
    </div>
  );
}
