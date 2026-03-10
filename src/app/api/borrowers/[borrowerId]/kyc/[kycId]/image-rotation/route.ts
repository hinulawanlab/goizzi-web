import { NextResponse, type NextRequest } from "next/server";

import { hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { setBorrowerKycImageRotation } from "@/shared/services/kycService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

interface ImageRotationPayload {
  storagePath?: string;
  rotationDeg?: number;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; kycId: string }> }
) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }

  const { borrowerId, kycId } = await context.params;
  if (!borrowerId || !kycId) {
    return NextResponse.json({ error: "Missing borrower or KYC id." }, { status: 400 });
  }

  let payload: ImageRotationPayload = {};
  try {
    payload = (await request.json()) as ImageRotationPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof payload.storagePath !== "string" || !payload.storagePath.trim()) {
    return NextResponse.json({ error: "storagePath is required." }, { status: 400 });
  }

  if (typeof payload.rotationDeg !== "number" || !Number.isFinite(payload.rotationDeg)) {
    return NextResponse.json({ error: "rotationDeg must be a number." }, { status: 400 });
  }

  try {
    const rotationDeg = await setBorrowerKycImageRotation(
      borrowerId,
      kycId,
      payload.storagePath,
      payload.rotationDeg
    );

    return NextResponse.json({ rotationDeg });
  } catch (error) {
    console.warn("Unable to update KYC image rotation:", error);
    return NextResponse.json({ error: "Failed to update KYC image rotation." }, { status: 500 });
  }
}
