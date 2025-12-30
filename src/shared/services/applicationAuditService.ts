import { Timestamp } from "firebase-admin/firestore";

import { db } from "@/shared/singletons/firebaseAdmin";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import { buildBorrowerNoteData, sanitizeNote } from "@/shared/services/borrowerNoteUtils";
import { resolveActorName } from "@/shared/services/actorNameResolver";

const validStatuses = ["Reject", "Reviewed", "Approve", "Completed"] as const;

export type ApplicationStatusAction = (typeof validStatuses)[number];

interface NoteInput {
  borrowerId: string;
  applicationId?: string;
  type?: string;
  note: string;
  createdByName?: string;
  createdByUserId?: string;
}

interface StatusActionInput {
  borrowerId: string;
  applicationId: string;
  status: ApplicationStatusAction;
  actorName?: string;
  actorUserId?: string;
}

export async function addBorrowerApplicationNote(input: NoteInput): Promise<BorrowerNote> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.borrowerId) {
    throw new Error("Borrower id is missing.");
  }

  const trimmedNote = sanitizeNote(input.note);
  if (!trimmedNote) {
    throw new Error("Note cannot be empty.");
  }

  const createdAt = Timestamp.now();
  const createdAtIso = createdAt.toDate().toISOString();
  const actorName = await resolveActorName(input.createdByUserId, input.createdByName);
  const noteRef = db.collection("borrowers").doc(input.borrowerId).collection("notes").doc();

  const noteData = buildBorrowerNoteData({
    noteId: noteRef.id,
    applicationId: input.applicationId,
    type: input.type,
    note: trimmedNote,
    createdAt: createdAtIso,
    createdByName: actorName,
    createdByUserId: input.createdByUserId
  });

  const batch = db.batch();
  batch.set(noteRef, { ...noteData, createdAt });
  if (input.applicationId) {
    const applicationRef = db
      .collection("borrowers")
      .doc(input.borrowerId)
      .collection("application")
      .doc(input.applicationId);
    batch.set(
      applicationRef,
      {
        updatedAt: createdAt
      },
      { merge: true }
    );
  }
  await batch.commit();

  return noteData;
}

export async function setBorrowerApplicationStatusWithNote(
  input: StatusActionInput
): Promise<{ updatedAt: string; status: ApplicationStatusAction; statusUpdatedByName: string; note: BorrowerNote }> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.borrowerId || !input.applicationId) {
    throw new Error("Borrower or application id is missing.");
  }
  if (!validStatuses.includes(input.status)) {
    throw new Error("Status must be a valid value.");
  }

  const createdAt = Timestamp.now();
  const createdAtIso = createdAt.toDate().toISOString();
  const actorName = await resolveActorName(input.actorUserId, input.actorName);
  const noteText = `Status set to ${input.status}.`;

  const noteRef = db.collection("borrowers").doc(input.borrowerId).collection("notes").doc();
  const applicationRef = db
    .collection("borrowers")
    .doc(input.borrowerId)
    .collection("application")
    .doc(input.applicationId);

  const noteData = buildBorrowerNoteData({
    noteId: noteRef.id,
    applicationId: input.applicationId,
    note: noteText,
    createdAt: createdAtIso,
    createdByName: actorName,
    createdByUserId: input.actorUserId
  });

  const batch = db.batch();
  batch.set(noteRef, { ...noteData, createdAt });
  batch.set(
    applicationRef,
    {
      status: input.status,
      updatedAt: createdAt,
      statusUpdatedByName: actorName,
      statusUpdatedByUserId: input.actorUserId ?? null
    },
    { merge: true }
  );
  await batch.commit();

  return {
    updatedAt: createdAtIso,
    status: input.status,
    statusUpdatedByName: actorName,
    note: noteData
  };
}
