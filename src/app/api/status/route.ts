import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/shared/singletons/firebaseAdmin";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

export async function GET(request: NextRequest) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({
      status: "ok",
      branchesCached: 0,
      warning: "Firebase Admin credentials are not configured."
    });
  }

  const branchesSnapshot = await db.collection("branches").limit(1).get();

  return NextResponse.json({
    status: "ok",
    branchesCached: branchesSnapshot.size
  });
}
