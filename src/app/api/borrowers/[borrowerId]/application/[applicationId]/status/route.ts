import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import {
  type ApplicationStatusAction,
  setBorrowerApplicationStatusWithNote
} from "@/shared/services/applicationAuditService";

interface StatusPayload {
  status?: ApplicationStatusAction;
  actorName?: string;
  actorUserId?: string;
}

const validStatuses: ApplicationStatusAction[] = ["Reject", "Reviewed", "Approve", "Completed"];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; applicationId: string }> }
) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId, applicationId } = await context.params;
  if (!borrowerId || !applicationId) {
    return NextResponse.json({ error: "Missing borrower or application id." }, { status: 400 });
  }

  let payload: StatusPayload = {};
  try {
    payload = (await request.json()) as StatusPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.status || !validStatuses.includes(payload.status)) {
    return NextResponse.json({ error: "status must be a valid value." }, { status: 400 });
  }

  try {
    const result = await setBorrowerApplicationStatusWithNote({
      borrowerId,
      applicationId,
      status: payload.status,
      actorName: payload.actorName,
      actorUserId: payload.actorUserId
    });
    return NextResponse.json(result);
  } catch (error) {
    console.warn("Unable to update application status:", error);
    return NextResponse.json({ error: "Failed to update application status." }, { status: 500 });
  }
}
