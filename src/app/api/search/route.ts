import { NextResponse } from "next/server";
import { searchDiscover } from "@/lib/discover/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 1) {
    return NextResponse.json({
      releases: [],
      artists: [],
      tracks: [],
    });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "Requête trop longue." }, { status: 400 });
  }

  const results = await searchDiscover(q, 10);
  return NextResponse.json(results);
}
