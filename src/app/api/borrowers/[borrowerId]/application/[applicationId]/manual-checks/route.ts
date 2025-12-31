import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { setBorrowerApplicationManualChecks } from "@/shared/services/applicationManualChecklistService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

interface ManualChecksPayload {
  manualVerified?: string[];
  actorUserId?: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; applicationId: string }> }
) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId, applicationId } = await context.params;
  if (!borrowerId || !applicationId) {
    return NextResponse.json({ error: "Missing borrower or application id." }, { status: 400 });
  }

  let payload: ManualChecksPayload = {};
  try {
    payload = (await request.json()) as ManualChecksPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!Array.isArray(payload.manualVerified)) {
    return NextResponse.json({ error: "manualVerified must be an array of strings." }, { status: 400 });
  }

  try {
    const result = await setBorrowerApplicationManualChecks({
      borrowerId,
      applicationId,
      manualVerified: payload.manualVerified,
      actorUserId: payload.actorUserId
    });

    return NextResponse.json(result);
  } catch (error) {
    console.warn("Unable to update manual checklist:", error);
    return NextResponse.json({ error: "Failed to update manual checklist." }, { status: 500 });
  }
}
