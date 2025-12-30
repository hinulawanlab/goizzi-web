import type { LoanNote } from "@/shared/types/loanNote";
import { sanitizeName, sanitizeNote } from "@/shared/services/borrowerNoteUtils";

interface LoanNoteInput {
  noteId: string;
  loanId: string;
  borrowerId?: string;
  applicationId?: string;
  type?: string;
  isActive?: boolean;
  callActive?: boolean;
  messageActive?: boolean;
  note: string;
  createdAt: string;
  createdByName?: string;
  createdByUserId?: string;
}

export function buildLoanNoteData(input: LoanNoteInput): LoanNote & { createdByName: string } {
  const noteData: LoanNote & { createdByName: string } = {
    noteId: input.noteId,
    loanId: input.loanId,
    note: sanitizeNote(input.note),
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
  if (typeof input.isActive === "boolean") {
    noteData.isActive = input.isActive;
  }
  if (typeof input.callActive === "boolean") {
    noteData.callActive = input.callActive;
  }
  if (typeof input.messageActive === "boolean") {
    noteData.messageActive = input.messageActive;
  }
  if (input.createdByUserId) {
    noteData.createdByUserId = input.createdByUserId;
  }

  return noteData;
}
