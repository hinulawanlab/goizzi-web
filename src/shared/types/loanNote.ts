export interface LoanNote {
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
