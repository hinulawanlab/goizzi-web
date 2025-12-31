import { NextResponse } from "next/server";

import { getSettingsStats } from "@/shared/services/settingsStatsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getSettingsStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Settings stats API failed:", error);
    return NextResponse.json({ error: "Unable to fetch settings stats." }, { status: 500 });
  }
}
