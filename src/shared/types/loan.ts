export type LoanStatus =
  | "draft"
  | "approved"
  | "active"
  | "delinquent"
  | "pastdue"
  | "closed"
  | "writtenOff"
  | "cancelled";

export interface LoanSummary {
  loanId: string;
  borrowerId: string;
  applicationId?: string;
  status: LoanStatus;
  productId?: string;
  productName?: string;
  principalAmount?: number;
  termMonths?: number;
  termDays?: number;
  paymentFrequency?: number;
  totalOutstandingAmount?: number;
  currency?: string;
  startDate?: string;
  nextDueDate?: string;
  maturityDate?: string;
  lastPaymentAt?: string;
  updatedAt?: string;
  isFullpayment?: boolean;
}
