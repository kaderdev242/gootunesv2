import { NextResponse } from "next/server";
import { persistSystemLog } from "@/lib/system-log";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const rl = await checkRateLimit(`system-log:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  let body: {
    source?: string;
    message?: string;
    stack?: string | null;
    path?: string | null;
    digest?: string | null;
    context?: Record<string, unknown>;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = String(body.message || "").trim();
  if (!message) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await persistSystemLog({
    level: "error",
    source: String(body.source || "client").slice(0, 120),
    message: message.slice(0, 2000),
    stack: body.stack ? String(body.stack).slice(0, 8000) : null,
    path: body.path ? String(body.path).slice(0, 500) : null,
    digest: body.digest ? String(body.digest).slice(0, 200) : null,
    context: body.context || {},
  });

  return NextResponse.json({ ok: true });
}
