export interface BorrowerFollowUpSummary {
  borrowerId: string;
  fullName: string;
  phone: string;
  branch: string;
  branchDocumentId?: string;
  followUpCount: number;
  followUpAt: string;
}
