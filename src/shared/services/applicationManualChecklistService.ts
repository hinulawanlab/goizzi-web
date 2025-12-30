import { Timestamp } from "firebase-admin/firestore";

import { db } from "@/shared/singletons/firebaseAdmin";

interface ManualChecklistInput {
  borrowerId: string;
  applicationId: string;
  manualVerified: string[];
  actorUserId?: string;
}

export async function setBorrowerApplicationManualChecks(input: ManualChecklistInput): Promise<{
  manualVerified: string[];
  manuallyVerifiedBy: string | null;
  updatedAt: string;
}> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.borrowerId || !input.applicationId) {
    throw new Error("Borrower or application id is missing.");
  }

  const cleaned = input.manualVerified
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);

  const unique = Array.from(new Set(cleaned));
  const updatedAt = Timestamp.now();
  const updatedAtIso = updatedAt.toDate().toISOString();
  const applicationRef = db
    .collection("borrowers")
    .doc(input.borrowerId)
    .collection("application")
    .doc(input.applicationId);

  await applicationRef.set(
    {
      manualVerified: unique,
      manuallyVerifiedBy: input.actorUserId ?? null,
      updatedAt
    },
    { merge: true }
  );

  return {
    manualVerified: unique,
    manuallyVerifiedBy: input.actorUserId ?? null,
    updatedAt: updatedAtIso
  };
}
