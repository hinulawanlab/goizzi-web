import { NextResponse } from "next/server";

import { db, hasAdminCredentials, storageBucket } from "@/shared/singletons/firebaseAdmin";

interface KycDocData {
  storageRefs?: string[];
  storageRef?: string;
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
  const primary = typeof data.storageRef === "string" ? data.storageRef : undefined;
  const combined = primary ? [primary, ...refs] : refs;
  return combined.map(normalizeStoragePath).filter(Boolean) as string[];
}

export async function GET(request: Request, context: { params: Promise<{ borrowerId: string; kycId: string }> }) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }
  if (!db || !storageBucket) {
    return NextResponse.json({ error: "Firebase Admin services are not initialized." }, { status: 500 });
  }
  const bucket = storageBucket;

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
      return NextResponse.json({ urls: [] });
    }

    const signedUrls: [string][] = await Promise.all(
      filteredRefs.map((path) =>
        bucket.file(path).getSignedUrl({
          action: "read",
          expires: Date.now() + 15 * 60 * 1000
        })
      )
    );

    return NextResponse.json({ urls: signedUrls.map((entry) => entry[0]) });
  } catch (error) {
    console.warn("Unable to fetch KYC images:", error);
    return NextResponse.json({ error: "Failed to fetch KYC images." }, { status: 500 });
  }
}
