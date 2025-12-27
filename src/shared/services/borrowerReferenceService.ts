import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoBorrowerReferences } from "@/shared/data/demoBorrowerReferences";
import type { BorrowerReference, ReferenceContactStatus } from "@/shared/types/borrowerReference";

function formatTimestamp(value: unknown): string {
  if (!value) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return ((value as { toDate?: () => Date }).toDate as () => Date)().toISOString().split("T")[0];
  }

  const toMillisFn = (value as { toMillis?: () => number }).toMillis;
  if (typeof toMillisFn === "function") {
    return new Date(toMillisFn()).toISOString().split("T")[0];
  }

  const seconds = (value as { _seconds?: number })._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toISOString().split("T")[0];
  }

  return "N/A";
}

function normalizeString(value: unknown, fallback = "N/A"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return fallback;
}

function normalizeContactStatus(value: unknown): ReferenceContactStatus {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "agreed" || normalized === "declined" || normalized === "no_response") {
      return normalized;
    }
  }
  return "pending";
}

function mapReferenceDoc(doc: DocumentSnapshot): BorrowerReference {
  const data = doc.data() || {};
  return {
    referenceId: doc.id,
    name: normalizeString(data.name, "Unknown"),
    mobileNumber: normalizeString(data.mobileNumber, "N/A"),
    address: normalizeString(data.address, "N/A"),
    createdAt: formatTimestamp(data.createdAt),
    contactStatus: normalizeContactStatus(data.contactStatus ?? data.status)
  };
}

async function fetchBorrowerReferencesFromFirestore(borrowerId: string, limit = 20): Promise<BorrowerReference[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("references")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(mapReferenceDoc);
}

export async function getBorrowerReferences(borrowerId: string, limit = 20): Promise<BorrowerReference[]> {
  if (!borrowerId) {
    return [];
  }

  if (hasAdminCredentials()) {
    try {
      return await fetchBorrowerReferencesFromFirestore(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch references for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerReferences[borrowerId] ?? [];
}

export async function setBorrowerReferenceStatus(
  borrowerId: string,
  referenceId: string,
  contactStatus: ReferenceContactStatus
): Promise<void> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!borrowerId || !referenceId) {
    throw new Error("Borrower or reference id is missing.");
  }

  await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("references")
    .doc(referenceId)
    .set(
      {
        contactStatus,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
}
