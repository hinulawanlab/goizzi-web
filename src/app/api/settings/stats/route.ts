import { NextResponse, type NextRequest } from "next/server";

import { getSettingsStats } from "@/shared/services/settingsStatsService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const stats = await getSettingsStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Settings stats API failed:", error);
    return NextResponse.json({ error: "Unable to fetch settings stats." }, { status: 500 });
  }
}
