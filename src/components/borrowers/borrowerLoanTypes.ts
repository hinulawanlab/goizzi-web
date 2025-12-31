// src/components/borrowers/borrowerLoanTypes.ts
export const borrowerLoanTabKeys = ["details", "payments", "statement", "audit"] as const;
export type BorrowerLoanTabKey = (typeof borrowerLoanTabKeys)[number];

export const borrowerLoanTabs: { key: BorrowerLoanTabKey; label: string }[] = [
  { key: "details", label: "Loan details" },
  { key: "payments", label: "Payments" },
  { key: "statement", label: "Statement of account" },
  { key: "audit", label: "Audit" }
];

export const borrowerLoanActions = ["Print loan form"] as const;
export type BorrowerLoanAction = (typeof borrowerLoanActions)[number];

export function isBorrowerLoanTabKey(value?: string | null): value is BorrowerLoanTabKey {
  if (!value) {
    return false;
  }
  return borrowerLoanTabKeys.includes(value as BorrowerLoanTabKey);
}
