import type { LoanProductSummary } from "@/shared/types/product";

export const demoLoanProducts: LoanProductSummary[] = [
  {
    productId: "regular",
    name: "Personal Loan",
    isActive: true
  },
  {
    productId: "business",
    name: "Business Loan",
    isActive: false
  }
];
