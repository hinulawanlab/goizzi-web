import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { setBorrowerGovernmentIdApproval } from "@/shared/services/kycService";

interface ApprovalPayload {
  isApproved?: boolean;
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

  let payload: ApprovalPayload = {};
  try {
    payload = (await request.json()) as ApprovalPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof payload.isApproved !== "boolean") {
    return NextResponse.json({ error: "isApproved must be a boolean." }, { status: 400 });
  }

  try {
    await setBorrowerGovernmentIdApproval(borrowerId, kycId, payload.isApproved);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Unable to update KYC approval:", error);
    return NextResponse.json({ error: "Failed to update KYC approval." }, { status: 500 });
  }
}
