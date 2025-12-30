export interface BorrowerNote {
  noteId: string;
  applicationId?: string;
  type?: string;
  note: string;
  createdAt: string;
  createdByName?: string;
  createdByUserId?: string;
}
