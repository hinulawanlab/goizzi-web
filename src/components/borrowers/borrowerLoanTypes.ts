export type BorrowerLoanTabKey = "details" | "payments" | "statement";

export const borrowerLoanTabs: { key: BorrowerLoanTabKey; label: string }[] = [
  { key: "details", label: "Loan details" },
  { key: "payments", label: "Payments" },
  { key: "statement", label: "Statement of account" }
];

export const borrowerLoanActions = ["Print loan form", "Send push notif", "Send notes"] as const;
export type BorrowerLoanAction = (typeof borrowerLoanActions)[number];
