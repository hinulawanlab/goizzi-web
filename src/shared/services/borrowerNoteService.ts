import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoBorrowerNotes } from "@/shared/data/demoBorrowerNotes";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import { getUserDisplayNamesByIds } from "@/shared/services/userService";

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

function mapNoteDoc(doc: DocumentSnapshot): BorrowerNote {
  const data = doc.data() || {};
  return {
    noteId: doc.id,
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

async function hydrateNoteAuthors(notes: BorrowerNote[]): Promise<BorrowerNote[]> {
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

async function fetchBorrowerNotesFromFirestore(borrowerId: string, applicationId: string): Promise<BorrowerNote[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("notes")
    .where("applicationId", "==", applicationId)
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(mapNoteDoc);
}

export async function getBorrowerNotesByApplication(
  borrowerId: string,
  applicationId: string
): Promise<BorrowerNote[]> {
  if (!borrowerId || !applicationId) {
    return [];
  }

  if (hasAdminCredentials()) {
    try {
      const notes = await fetchBorrowerNotesFromFirestore(borrowerId, applicationId);
      return await hydrateNoteAuthors(notes);
    } catch (error) {
      console.warn(`Unable to fetch notes for ${borrowerId} ${applicationId}:`, error);
    }
  }

  const demoNotes = demoBorrowerNotes[borrowerId] ?? [];
  return demoNotes.filter((note) => note.applicationId === applicationId);
}

export async function updateBorrowerNoteFlags(
  borrowerId: string,
  noteId: string,
  updates: { isActive?: boolean; callActive?: boolean; messageActive?: boolean }
): Promise<BorrowerNote> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!borrowerId || !noteId) {
    throw new Error("Borrower or note id is missing.");
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

  const noteRef = db.collection("borrowers").doc(borrowerId).collection("notes").doc(noteId);
  await noteRef.set(payload, { merge: true });
  const updated = await noteRef.get();
  if (!updated.exists) {
    throw new Error("Borrower note not found.");
  }
  return mapNoteDoc(updated);
}
