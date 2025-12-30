import type { LoanNote } from "@/shared/types/loanNote";
import { sanitizeName, sanitizeNote } from "@/shared/services/borrowerNoteUtils";

interface LoanNoteInput {
  noteId: string;
  loanId: string;
  borrowerId?: string;
  applicationId?: string;
  type?: string;
  note: string;
  createdAt: string;
  createdByName?: string;
  createdByUserId?: string;
}

export function buildLoanNoteData(input: LoanNoteInput): LoanNote & { createdByName: string } {
  return {
    noteId: input.noteId,
    loanId: input.loanId,
    borrowerId: input.borrowerId,
    applicationId: input.applicationId,
    type: input.type,
    note: sanitizeNote(input.note),
    createdAt: input.createdAt,
    createdByName: sanitizeName(input.createdByName),
    createdByUserId: input.createdByUserId
  };
}
