import { NextResponse } from "next/server";

import { db } from "@/shared/singletons/firebaseAdmin";

export async function GET() {
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
