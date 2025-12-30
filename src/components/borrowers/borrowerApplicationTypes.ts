// src/components/borrowers/borrowerApplicationTypes.ts
export type TabKey =
  | "maker"
  | "comakers"
  | "references"
  | "proof"
  | "bankStatements"
  | "payslips"
  | "propertyTitles"
  | "otherDocuments"
  | "audit";
export type ActionState = "idle" | "working" | "success" | "error";

export const tabs: { key: TabKey; label: string }[] = [
  { key: "maker", label: "Maker" },
  { key: "comakers", label: "Co-makers" },
  { key: "references", label: "References" },
  { key: "proof", label: "Proof of billing" },
  { key: "bankStatements", label: "Bank records" },
  { key: "payslips", label: "Income source" },
  // { key: "propertyTitles", label: "Property titles" },
  { key: "otherDocuments", label: "Others" },
  { key: "audit", label: "Audit" }
];

export const loanActions = ["Reject", "Reviewed", "Approve"] as const;
export type LoanAction = (typeof loanActions)[number];
export type StoredLoanStatus = LoanAction | "rejected";
