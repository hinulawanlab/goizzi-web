export interface BorrowerNote {
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
