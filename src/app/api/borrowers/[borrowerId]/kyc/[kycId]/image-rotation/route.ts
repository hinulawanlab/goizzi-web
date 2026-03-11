import { NextResponse, type NextRequest } from "next/server";

import { auth, db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { setBorrowerKycImageRotation } from "@/shared/services/kycService";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";

interface ImageRotationPayload {
  storagePath?: string;
  rotationDeg?: number;
}

function getAuthToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

function isAdminUid(uid: string): boolean {
  return uid === "vr9fD7BrLbRyxDiOlTBkTyxxvgG3" || uid === "jx87T1OeBgNcquUU8uMXIT7KIp43";
}

async function isStaffUid(uid: string): Promise<boolean> {
  if (isAdminUid(uid)) {
    return true;
  }
  if (!db) {
    return false;
  }
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) {
    return false;
  }
  const data = doc.data() as { status?: string; role?: string } | undefined;
  return data?.status === "active" && ["admin", "team lead", "team member", "auditor"].includes(data?.role ?? "");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ borrowerId: string; kycId: string }> }
) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    const token = getAuthToken(request);
    if (!token || !auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      const isStaff = await isStaffUid(decoded.uid);
      if (!isStaff) {
        return NextResponse.json({ error: "Not authorized to update KYC image rotation." }, { status: 403 });
      }
    } catch (error) {
      console.warn("Unable to verify Firebase ID token for KYC image rotation.", error);
      return NextResponse.json({ error: "Invalid authorization token." }, { status: 401 });
    }
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
