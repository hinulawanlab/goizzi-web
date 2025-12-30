// src/components/borrowers/borrowerLoanTypes.ts
export type BorrowerLoanTabKey = "details" | "payments" | "statement" | "audit";

export const borrowerLoanTabs: { key: BorrowerLoanTabKey; label: string }[] = [
  { key: "details", label: "Loan details" },
  { key: "payments", label: "Payments" },
  { key: "statement", label: "Statement of account" },
  { key: "audit", label: "Audit" }
];

export const borrowerLoanActions = ["Print loan form", "Send notes"] as const;
export type BorrowerLoanAction = (typeof borrowerLoanActions)[number];
