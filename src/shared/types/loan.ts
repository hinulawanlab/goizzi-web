export type LoanStatus = "draft" | "active" | "delinquent" | "closed" | "writtenOff";

export interface LoanSummary {
  loanId: string;
  borrowerId: string;
  status: LoanStatus;
  productId?: string;
  productName?: string;
  principalMinor?: number;
  totalOutstandingMinor?: number;
  currency?: string;
  startDate?: string;
  nextDueDate?: string;
  lastPaymentAt?: string;
  updatedAt?: string;
}
