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
  { key: "maker", label: "Maker's details" },
  { key: "comakers", label: "Co-makers" },
  { key: "references", label: "References" },
  { key: "proof", label: "Proof of billing" },
  { key: "bankStatements", label: "Bank statements" },
  { key: "payslips", label: "Payslips" },
  { key: "propertyTitles", label: "Property titles" },
  { key: "otherDocuments", label: "Others" },
  { key: "audit", label: "Audit" }
];

export const loanActions = ["Reject", "Reviewed", "Approved", "Completed"] as const;
export type LoanAction = (typeof loanActions)[number];
