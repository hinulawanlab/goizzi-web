import { db } from "@/shared/singletons/firebaseAdmin";

export async function setBorrowerKycMissingCount(borrowerId: string, missingCount: number): Promise<void> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!borrowerId) {
    throw new Error("Borrower id is missing.");
  }
  if (!Number.isFinite(missingCount) || missingCount < 0) {
    throw new Error("Missing count must be a non-negative number.");
  }

  await db
    .collection("borrowers")
    .doc(borrowerId)
    .set(
      {
        kycMissingCount: Math.trunc(missingCount)
      },
      { merge: true }
    );
}
