export type LoanStatus = "draft" | "approved" | "active" | "delinquent" | "closed" | "writtenOff";

export interface LoanSummary {
  loanId: string;
  borrowerId: string;
  status: LoanStatus;
  productId?: string;
  productName?: string;
  principalAmount?: number;
  totalOutstandingAmount?: number;
  currency?: string;
  startDate?: string;
  nextDueDate?: string;
  lastPaymentAt?: string;
  updatedAt?: string;
}
