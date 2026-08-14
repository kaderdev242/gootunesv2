import { NextResponse } from "next/server";
import { getTrackPlaybackAccess } from "@/lib/audio/access";

type Params = { params: Promise<{ trackId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { trackId } = await params;
  const access = await getTrackPlaybackAccess(trackId);

  if (access.status === "not_found") {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (access.status === "unavailable") {
    return NextResponse.json({ error: "Indisponible" }, { status: 403 });
  }

  return NextResponse.json(
    {
      access: access.access,
      owned: access.owned,
      previewSeconds: access.previewSeconds,
      trackId: access.trackId,
      releaseId: access.releaseId,
      durationSeconds: access.durationSeconds,
      streamUrl: `/api/stream/${access.trackId}`,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
