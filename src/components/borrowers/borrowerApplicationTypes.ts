export type TabKey = "maker" | "comakers" | "references" | "proof" | "documents" | "audit";
export type ActionState = "idle" | "working" | "success" | "error";

export const tabs: { key: TabKey; label: string }[] = [
  { key: "maker", label: "Maker's details" },
  { key: "comakers", label: "Co-makers" },
  { key: "references", label: "References" },
  { key: "proof", label: "Proof of billing" },
  { key: "documents", label: "Loan documents" },
  { key: "audit", label: "Audit" }
];

export const loanActions = ["Reject", "Reviewed", "Approved", "Completed"] as const;
export type LoanAction = (typeof loanActions)[number];
