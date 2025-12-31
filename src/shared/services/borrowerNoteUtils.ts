import type { BorrowerNote } from "@/shared/types/borrowerNote";

interface BorrowerNoteInput {
  noteId: string;
  borrowerId?: string;
  applicationId?: string;
  type?: string;
  note: string;
  createdAt: string;
  createdByName?: string;
  createdByUserId?: string;
  callActive?: boolean;
  isActive?: boolean;
  messageActive?: boolean;
  isSeen?: boolean;
}

export function sanitizeName(value?: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length) {
      return trimmed;
    }
  }
  return "Unknown staff";
}

export function sanitizeNote(value: string): string {
  return value.trim();
}

export function buildBorrowerNoteData(input: BorrowerNoteInput): BorrowerNote & { createdByName: string } {
  const noteData: BorrowerNote & { createdByName: string } = {
    noteId: input.noteId,
    note: input.note,
    createdAt: input.createdAt,
    createdByName: sanitizeName(input.createdByName)
  };

  if (input.borrowerId) {
    noteData.borrowerId = input.borrowerId;
  }
  if (input.applicationId) {
    noteData.applicationId = input.applicationId;
  }
  if (input.type) {
    noteData.type = input.type;
  }
  if (input.createdByUserId) {
    noteData.createdByUserId = input.createdByUserId;
  }
  if (typeof input.callActive === "boolean") {
    noteData.callActive = input.callActive;
  }
  if (typeof input.isActive === "boolean") {
    noteData.isActive = input.isActive;
  }
  if (typeof input.messageActive === "boolean") {
    noteData.messageActive = input.messageActive;
  }
  if (typeof input.isSeen === "boolean") {
    noteData.isSeen = input.isSeen;
  }

  return noteData;
}
