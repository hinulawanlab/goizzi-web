import { db } from "@/shared/singletons/firebaseAdmin";

export async function clearBorrowerFollowUp(borrowerId: string): Promise<void> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!borrowerId) {
    throw new Error("Borrower id is missing.");
  }

  await db
    .collection("borrowers")
    .doc(borrowerId)
    .set(
      {
        followUp: false,
        followUpCount: 0,
        followUpAt: null
      },
      { merge: true }
    );
}
