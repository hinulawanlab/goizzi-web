import type { BorrowerNote } from "@/shared/types/borrowerNote";

export const demoBorrowerNotes: Record<string, BorrowerNote[]> = {
  "B-1001": [
    {
      noteId: "NOTE-1001",
      applicationId: "APP-1001",
      note: "Borrower confirmed intent to proceed with the application.",
      createdAt: "2025-12-27",
      createdByName: "Maria Santos",
      createdByUserId: "user-admin-001"
    },
    {
      noteId: "NOTE-1002",
      applicationId: "APP-1001",
      note: "Status set to Reviewed.",
      createdAt: "2025-12-27",
      createdByName: "Jorge de Vera",
      createdByUserId: "user-manager-002"
    }
  ]
};
