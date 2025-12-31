import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { setBorrowerReferenceStatus } from "@/shared/services/borrowerReferenceService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";
import type { ReferenceContactStatus } from "@/shared/types/borrowerReference";

interface StatusPayload {
  contactStatus?: ReferenceContactStatus;
}

const validStatuses: ReferenceContactStatus[] = ["pending", "agreed", "declined", "no_response"];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; referenceId: string }> }
) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId, referenceId } = await context.params;
  if (!borrowerId || !referenceId) {
    return NextResponse.json({ error: "Missing borrower or reference id." }, { status: 400 });
  }

  let payload: StatusPayload = {};
  try {
    payload = (await request.json()) as StatusPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.contactStatus || !validStatuses.includes(payload.contactStatus)) {
    return NextResponse.json({ error: "contactStatus must be a valid value." }, { status: 400 });
  }

  try {
    await setBorrowerReferenceStatus(borrowerId, referenceId, payload.contactStatus);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Unable to update reference status:", error);
    return NextResponse.json({ error: "Failed to update reference status." }, { status: 500 });
  }
}
