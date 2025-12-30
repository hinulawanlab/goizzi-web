import type { LoanSummary } from "@/shared/types/loan";

export const demoBorrowerLoans: Record<string, LoanSummary[]> = {
  "B-1001": [
    {
      loanId: "LN-2024-1001",
      borrowerId: "B-1001",
      applicationId: "APP-2024-1001",
      status: "active",
      productId: "regular",
      productName: "Personal Loan",
      principalAmount: 200000,
      termMonths: 12,
      paymentFrequency: 30,
      interestRate: 0.03,
      totalOutstandingAmount: 154000,
      currency: "PHP",
      startDate: "2024-10-04",
      nextDueDate: "2025-01-05",
      maturityDate: "2025-10-04",
      lastPaymentAt: "2024-12-12",
      updatedAt: "2024-12-12",
      isFullpayment: false
    },
    {
      loanId: "LN-2023-0902",
      borrowerId: "B-1001",
      applicationId: "APP-2023-0902",
      status: "closed",
      productId: "regular",
      productName: "Personal Loan",
      principalAmount: 150000,
      termMonths: 10,
      paymentFrequency: 30,
      interestRate: 0.03,
      totalOutstandingAmount: 0,
      currency: "PHP",
      startDate: "2023-03-12",
      nextDueDate: "2024-02-12",
      maturityDate: "2024-02-12",
      lastPaymentAt: "2024-02-10",
      updatedAt: "2024-02-10",
      isFullpayment: true
    }
  ]
};
