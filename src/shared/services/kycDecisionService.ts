import { db } from "@/shared/singletons/firebaseAdmin";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import { buildBorrowerNoteData } from "@/shared/services/borrowerNoteUtils";
import { resolveActorName } from "@/shared/services/actorNameResolver";

const decisionNotes = {
  approve: "Proof of billing approved.",
  reject: "Proof of billing rejected.",
  waive: "Proof of billing waived.",
  unwaive: "Proof of billing unwaived."
} as const;

export type KycDecisionAction = keyof typeof decisionNotes;

interface KycDecisionInput {
  borrowerId: string;
  applicationId: string;
  kycId: string;
  action: KycDecisionAction;
  actorName?: string;
  actorUserId?: string;
}

function buildKycUpdate(action: KycDecisionAction): { isApproved?: boolean; isWaived?: boolean } {
  if (action === "approve") {
    return { isApproved: true };
  }
  if (action === "reject") {
    return { isApproved: false };
  }
  if (action === "waive") {
    return { isWaived: true };
  }
  return { isWaived: false };
}

export async function setBorrowerKycDecisionWithNote(input: KycDecisionInput): Promise<BorrowerNote> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.borrowerId || !input.applicationId || !input.kycId) {
    throw new Error("Borrower, application, or KYC id is missing.");
  }
  if (!(input.action in decisionNotes)) {
    throw new Error("Action must be a valid value.");
  }

  const createdAt = new Date().toISOString();
  const actorName = await resolveActorName(input.actorUserId, input.actorName);
  const noteText = decisionNotes[input.action];

  const noteRef = db.collection("borrowers").doc(input.borrowerId).collection("notes").doc();
  const applicationRef = db
    .collection("borrowers")
    .doc(input.borrowerId)
    .collection("application")
    .doc(input.applicationId);
  const kycRef = db.collection("borrowers").doc(input.borrowerId).collection("kyc").doc(input.kycId);

  const noteData = buildBorrowerNoteData({
    noteId: noteRef.id,
    applicationId: input.applicationId,
    note: noteText,
    createdAt,
    createdByName: actorName,
    createdByUserId: input.actorUserId
  });

  const batch = db.batch();
  batch.set(noteRef, noteData);
  batch.set(
    applicationRef,
    {
      updatedAt: createdAt
    },
    { merge: true }
  );
  batch.set(
    kycRef,
    {
      ...buildKycUpdate(input.action)
    },
    { merge: true }
  );
  await batch.commit();

  return noteData;
}
