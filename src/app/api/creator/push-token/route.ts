import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCreatorSession, requireCreatorApi } from "@/lib/creator/require-api";
import { logServerError } from "@/lib/errors";

export const dynamic = "force-dynamic";

function readBody(raw: unknown) {
  const body = (raw ?? {}) as { token?: unknown; platform?: unknown };
  const token = String(body.token ?? "").trim();
  const platform = String(body.platform ?? "").trim();
  return { token, platform };
}

/** Inscrit l'appareil connecté aux notifications (jeton FCM). */
export async function POST(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const { token, platform } = readBody(raw);
  if (!/^[A-Za-z0-9:_\-]{20,4096}$/.test(token)) {
    return NextResponse.json({ error: "Jeton invalide." }, { status: 400 });
  }
  if (platform !== "ios" && platform !== "android") {
    return NextResponse.json({ error: "Plateforme invalide." }, { status: 400 });
  }

  // Un jeton appartient à un seul compte : il passe au compte connecté.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (createAdminClient() as any).from("creator_push_tokens").upsert(
    { user_id: session.userId, token, platform, updated_at: new Date().toISOString() },
    { onConflict: "token" },
  );
  if (error) {
    logServerError("creator.pushToken.save", error);
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Désinscrit l'appareil (déconnexion). */
export async function DELETE(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }
  const { token } = readBody(raw);
  if (!token) return NextResponse.json({ ok: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (createAdminClient() as any)
    .from("creator_push_tokens")
    .delete()
    .eq("token", token)
    .eq("user_id", session.userId);
  return NextResponse.json({ ok: true });
}
