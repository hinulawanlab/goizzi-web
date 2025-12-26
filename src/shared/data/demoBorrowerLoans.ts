import type { LoanSummary } from "@/shared/types/loan";

export const demoBorrowerLoans: Record<string, LoanSummary[]> = {
  "B-1001": [
    {
      loanId: "LN-2024-1001",
      borrowerId: "B-1001",
      status: "active",
      productId: "regular",
      productName: "Personal Loan",
      principalMinor: 200000,
      totalOutstandingMinor: 154000,
      currency: "PHP",
      startDate: "2024-10-04",
      nextDueDate: "2025-01-05",
      lastPaymentAt: "2024-12-12",
      updatedAt: "2024-12-12"
    },
    {
      loanId: "LN-2023-0902",
      borrowerId: "B-1001",
      status: "closed",
      productId: "regular",
      productName: "Personal Loan",
      principalMinor: 150000,
      totalOutstandingMinor: 0,
      currency: "PHP",
      startDate: "2023-03-12",
      nextDueDate: "2024-02-12",
      lastPaymentAt: "2024-02-10",
      updatedAt: "2024-02-10"
    }
  ]
};
