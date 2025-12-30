export interface LoanNote {
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
