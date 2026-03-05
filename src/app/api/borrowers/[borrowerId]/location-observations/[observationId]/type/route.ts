import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { updateLocationObservationType } from "@/shared/services/locationService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";
import type { LocationType } from "@/shared/types/location";

interface LocationTypePayload {
  locationType?: LocationType | null;
}

function isValidLocationType(value: unknown): value is LocationType {
  return value === "home" || value === "work";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; observationId: string }> }
) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId, observationId } = await context.params;
  if (!borrowerId || !observationId) {
    return NextResponse.json({ error: "Missing borrower or observation id." }, { status: 400 });
  }

  let payload: LocationTypePayload = {};
  try {
    payload = (await request.json()) as LocationTypePayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const nextType = payload.locationType;
  if (!(nextType === null || isValidLocationType(nextType))) {
    return NextResponse.json({ error: "locationType must be home, work, or null." }, { status: 400 });
  }

  try {
    const observation = await updateLocationObservationType(borrowerId, observationId, nextType);
    return NextResponse.json({ observation });
  } catch (error) {
    console.warn("Unable to update location observation type:", error);
    return NextResponse.json({ error: "Failed to update location type." }, { status: 500 });
  }
}