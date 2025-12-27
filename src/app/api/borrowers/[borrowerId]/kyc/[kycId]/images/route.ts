import { NextResponse } from "next/server";

import { auth, db, hasAdminCredentials, storageBucket } from "@/shared/singletons/firebaseAdmin";

interface KycDocData {
  storageRefs?: string[];
  storageRef?: string;
  frontStorageRef?: string;
  backStorageRef?: string;
}

function normalizeStoragePath(path?: string): string | null {
  if (!path) {
    return null;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/^\/+/, "");
}

function buildStorageRefs(data: KycDocData): string[] {
  const refs = Array.isArray(data.storageRefs) ? data.storageRefs : [];
  const front = typeof data.frontStorageRef === "string" ? data.frontStorageRef : undefined;
  const back = typeof data.backStorageRef === "string" ? data.backStorageRef : undefined;
  const primary = typeof data.storageRef === "string" ? data.storageRef : undefined;
  const combined = [front, back, primary, ...refs].filter(Boolean) as string[];
  return combined.map(normalizeStoragePath).filter(Boolean) as string[];
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
  return data?.status === "active" && ["admin", "manager", "team", "auditor"].includes(data?.role ?? "");
}

export async function GET(request: Request, context: { params: Promise<{ borrowerId: string; kycId: string }> }) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }
  if (!db || !storageBucket || !auth) {
    return NextResponse.json({ error: "Firebase Admin services are not initialized." }, { status: 500 });
  }
  const bucket = storageBucket;

  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    const isStaff = await isStaffUid(decoded.uid);
    if (!isStaff) {
      return NextResponse.json({ error: "Not authorized to access KYC images." }, { status: 403 });
    }
  } catch (error) {
    console.warn("Unable to verify Firebase ID token.", error);
    return NextResponse.json({ error: "Invalid authorization token." }, { status: 401 });
  }

  const { borrowerId, kycId } = await context.params;
  if (!borrowerId || !kycId) {
    return NextResponse.json({ error: "Missing borrower or KYC id." }, { status: 400 });
  }

  try {
    const doc = await db.collection("borrowers").doc(borrowerId).collection("kyc").doc(kycId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "KYC record not found." }, { status: 404 });
    }

    const data = doc.data() as KycDocData;
    const refs = buildStorageRefs(data);
    const prefix = `borrowers/${borrowerId}/kyc/${kycId}/`;
    const filteredRefs = refs.filter((path) => path.startsWith(prefix));

    if (!filteredRefs.length) {
      return NextResponse.json({ urls: [], items: [] });
    }

    const signedItems = await Promise.all(
      filteredRefs.map(async (path) => {
        const [url] = await bucket.file(path).getSignedUrl({
          action: "read",
          expires: Date.now() + 15 * 60 * 1000
        });
        return { path, url };
      })
    );

    return NextResponse.json({
      urls: signedItems.map((entry) => entry.url),
      items: signedItems
    });
  } catch (error) {
    console.warn("Unable to fetch KYC images:", error);
    return NextResponse.json({ error: "Failed to fetch KYC images." }, { status: 500 });
  }
}
