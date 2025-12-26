import { db } from "@/shared/singletons/firebaseAdmin";
import type { BorrowerNote } from "@/shared/types/borrowerNote";

const validStatuses = ["Reject", "Reviewed", "Approved", "Completed"] as const;

export type ApplicationStatusAction = (typeof validStatuses)[number];

interface NoteInput {
  borrowerId: string;
  applicationId: string;
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

function sanitizeName(value?: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length) {
      return trimmed;
    }
  }
  return "Unknown staff";
}

function sanitizeNote(value: string): string {
  return value.trim();
}

function buildNoteData(
  noteId: string,
  applicationId: string,
  note: string,
  createdAt: string,
  createdByName?: string,
  createdByUserId?: string
): BorrowerNote & { createdByName: string } {
  return {
    noteId,
    applicationId,
    note,
    createdAt,
    createdByName: sanitizeName(createdByName),
    createdByUserId
  };
}

export async function addBorrowerApplicationNote(input: NoteInput): Promise<BorrowerNote> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.borrowerId || !input.applicationId) {
    throw new Error("Borrower or application id is missing.");
  }

  const trimmedNote = sanitizeNote(input.note);
  if (!trimmedNote) {
    throw new Error("Note cannot be empty.");
  }

  const createdAt = new Date().toISOString();
  const noteRef = db.collection("borrowers").doc(input.borrowerId).collection("notes").doc();
  const applicationRef = db
    .collection("borrowers")
    .doc(input.borrowerId)
    .collection("application")
    .doc(input.applicationId);

  const noteData = buildNoteData(
    noteRef.id,
    input.applicationId,
    trimmedNote,
    createdAt,
    input.createdByName,
    input.createdByUserId
  );

  const batch = db.batch();
  batch.set(noteRef, noteData);
  batch.set(
    applicationRef,
    {
      updatedAt: createdAt
    },
    { merge: true }
  );
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

  const createdAt = new Date().toISOString();
  const actorName = sanitizeName(input.actorName);
  const noteText = `Status set to ${input.status}.`;

  const noteRef = db.collection("borrowers").doc(input.borrowerId).collection("notes").doc();
  const applicationRef = db
    .collection("borrowers")
    .doc(input.borrowerId)
    .collection("application")
    .doc(input.applicationId);

  const noteData = buildNoteData(
    noteRef.id,
    input.applicationId,
    noteText,
    createdAt,
    actorName,
    input.actorUserId
  );

  const batch = db.batch();
  batch.set(noteRef, noteData);
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
    updatedAt: createdAt,
    status: input.status,
    statusUpdatedByName: actorName,
    note: noteData
  };
}
