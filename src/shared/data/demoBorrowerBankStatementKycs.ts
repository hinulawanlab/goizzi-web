import type { BorrowerBankStatementKyc } from "@/shared/types/kyc";

export const demoBorrowerBankStatementKycs: Record<string, BorrowerBankStatementKyc[]> = {
  "B-1001": [
    {
      borrowerId: "B-1001",
      kycId: "BS-1001",
      documentType: "Bank statements",
      accountName: "Demo Borrower",
      accountNumber: "0001234567",
      bankName: "Demo Bank",
      storageRefs: [],
      isApproved: undefined,
      isWaived: false,
      createdAt: "2025-12-20"
    }
  ]
};
