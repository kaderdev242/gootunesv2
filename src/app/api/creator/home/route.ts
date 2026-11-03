import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { getCreatorHome } from "@/lib/creator/overview";
import {
  isCreatorSession,
  publicCreatorProfile,
  requireCreatorApi,
} from "@/lib/creator/require-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  const supabase = await createRequestClient(request);
  const home = await getCreatorHome(supabase, session.userId);

  return NextResponse.json({
    profile: publicCreatorProfile(session.profile),
    ...home,
  });
}
