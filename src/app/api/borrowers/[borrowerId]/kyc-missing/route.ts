import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { setBorrowerKycMissingCount } from "@/shared/services/borrowerKycMissingService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

interface KycMissingPayload {
  kycMissingCount?: number;
}

export async function POST(request: NextRequest, context: { params: Promise<{ borrowerId: string }> }) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId } = await context.params;
  if (!borrowerId) {
    return NextResponse.json({ error: "Missing borrower id." }, { status: 400 });
  }

  let payload: KycMissingPayload = {};
  try {
    payload = (await request.json()) as KycMissingPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof payload.kycMissingCount !== "number") {
    return NextResponse.json({ error: "kycMissingCount must be a number." }, { status: 400 });
  }

  try {
    await setBorrowerKycMissingCount(borrowerId, payload.kycMissingCount);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Unable to update borrower KYC missing count:", error);
    return NextResponse.json({ error: "Failed to update KYC missing count." }, { status: 500 });
  }
}
