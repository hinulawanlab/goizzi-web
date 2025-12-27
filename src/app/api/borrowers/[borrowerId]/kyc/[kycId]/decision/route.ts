import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { setBorrowerKycDecisionWithNote, type KycDecisionAction } from "@/shared/services/kycDecisionService";

interface DecisionPayload {
  applicationId?: string;
  action?: KycDecisionAction;
  actorName?: string;
  actorUserId?: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; kycId: string }> }
) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId, kycId } = await context.params;
  if (!borrowerId || !kycId) {
    return NextResponse.json({ error: "Missing borrower or KYC id." }, { status: 400 });
  }

  let payload: DecisionPayload = {};
  try {
    payload = (await request.json()) as DecisionPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.applicationId) {
    return NextResponse.json({ error: "Missing application id." }, { status: 400 });
  }
  if (!payload.action) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  try {
    const note = await setBorrowerKycDecisionWithNote({
      borrowerId,
      applicationId: payload.applicationId,
      kycId,
      action: payload.action,
      actorName: payload.actorName,
      actorUserId: payload.actorUserId
    });
    return NextResponse.json({ note });
  } catch (error) {
    console.warn("Unable to update KYC decision:", error);
    return NextResponse.json({ error: "Failed to update KYC decision." }, { status: 500 });
  }
}
