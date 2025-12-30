import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import type { LoanNote } from "@/shared/types/loanNote";
import { buildLoanNoteData } from "@/shared/services/loanNoteUtils";
import { resolveActorName } from "@/shared/services/actorNameResolver";
import { getUserDisplayNamesByIds } from "@/shared/services/userService";

interface LoanNoteInput {
  loanId: string;
  borrowerId?: string;
  applicationId?: string;
  type?: string;
  note: string;
  createdByName?: string;
  createdByUserId?: string;
}

interface LoanNotesResult {
  notes: LoanNote[];
  error?: string;
}

function formatTimestamp(value: unknown): string {
  if (!value) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return ((value as { toDate?: () => Date }).toDate as () => Date)().toISOString();
  }

  const toMillisFn = (value as { toMillis?: () => number }).toMillis;
  if (typeof toMillisFn === "function") {
    return new Date(toMillisFn()).toISOString();
  }

  const seconds = (value as { _seconds?: number })._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toISOString();
  }

  return "N/A";
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
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

function mapLoanNoteDoc(doc: DocumentSnapshot, loanId: string): LoanNote {
  const data = doc.data() || {};
  return {
    noteId: doc.id,
    loanId: normalizeString(data.loanId, loanId),
    borrowerId: normalizeOptionalString(data.borrowerId),
    applicationId: normalizeOptionalString(data.applicationId),
    type: normalizeOptionalString(data.type),
    isActive: typeof data.isActive === "boolean" ? data.isActive : undefined,
    callActive: typeof data.callActive === "boolean" ? data.callActive : undefined,
    messageActive: typeof data.messageActive === "boolean" ? data.messageActive : undefined,
    isSeen: typeof data.isSeen === "boolean" ? data.isSeen : undefined,
    note: normalizeString(data.note, ""),
    createdAt: formatTimestamp(data.createdAt),
    createdByName: normalizeOptionalString(data.createdByName),
    createdByUserId: normalizeOptionalString(data.createdByUserId)
  };
}

async function hydrateNoteAuthors(notes: LoanNote[]): Promise<LoanNote[]> {
  const missingIds = Array.from(
    new Set(
      notes
        .filter((note) => !note.createdByName && note.createdByUserId)
        .map((note) => note.createdByUserId as string)
    )
  );

  if (!missingIds.length) {
    return notes;
  }

  const nameMap = await getUserDisplayNamesByIds(missingIds);
  if (!Object.keys(nameMap).length) {
    return notes;
  }

  return notes.map((note) => {
    if (note.createdByName || !note.createdByUserId) {
      return note;
    }
    const resolvedName = nameMap[note.createdByUserId];
    if (!resolvedName) {
      return note;
    }
    return { ...note, createdByName: resolvedName };
  });
}

async function fetchLoanNotesFromFirestore(loanId: string): Promise<LoanNote[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("loans")
    .doc(loanId)
    .collection("notes")
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => mapLoanNoteDoc(doc, loanId));
}

export async function addLoanNote(input: LoanNoteInput): Promise<LoanNote> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.loanId) {
    throw new Error("Loan id is missing.");
  }

  const trimmedNote = input.note.trim();
  if (!trimmedNote) {
    throw new Error("Note cannot be empty.");
  }

  const createdAt = Timestamp.now();
  const createdAtIso = createdAt.toDate().toISOString();
  const actorName = await resolveActorName(input.createdByUserId, input.createdByName);
  const noteRef = db.collection("loans").doc(input.loanId).collection("notes").doc();

  const noteData = buildLoanNoteData({
    noteId: noteRef.id,
    loanId: input.loanId,
    borrowerId: input.borrowerId,
    applicationId: input.applicationId,
    type: input.type,
    note: trimmedNote,
    createdAt: createdAtIso,
    createdByName: actorName,
    createdByUserId: input.createdByUserId
  });

  await noteRef.set({ ...noteData, createdAt });
  return noteData;
}

export async function updateLoanNoteFlags(
  loanId: string,
  noteId: string,
  updates: { isActive?: boolean; callActive?: boolean; messageActive?: boolean }
): Promise<LoanNote> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!loanId || !noteId) {
    throw new Error("Loan or note id is missing.");
  }

  const payload: Record<string, boolean> = {};
  if (typeof updates.isActive === "boolean") {
    payload.isActive = updates.isActive;
  }
  if (typeof updates.callActive === "boolean") {
    payload.callActive = updates.callActive;
  }
  if (typeof updates.messageActive === "boolean") {
    payload.messageActive = updates.messageActive;
  }

  if (!Object.keys(payload).length) {
    throw new Error("No valid updates provided.");
  }

  const noteRef = db.collection("loans").doc(loanId).collection("notes").doc(noteId);
  await noteRef.set(payload, { merge: true });
  const updated = await noteRef.get();
  if (!updated.exists) {
    throw new Error("Loan note not found.");
  }
  return mapLoanNoteDoc(updated, loanId);
}

export async function getLoanNotesByLoanId(loanId: string): Promise<LoanNotesResult> {
  if (!loanId) {
    return { notes: [] };
  }

  if (hasAdminCredentials()) {
    try {
      const notes = await fetchLoanNotesFromFirestore(loanId);
      return { notes: await hydrateNoteAuthors(notes) };
    } catch (error) {
      console.warn(`Unable to fetch loan notes for ${loanId}:`, error);
      return { notes: [], error: "Unable to load loan notes." };
    }
  }

  return { notes: [] };
}
