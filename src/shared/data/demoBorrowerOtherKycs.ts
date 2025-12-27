import type { BorrowerOtherKyc } from "@/shared/types/kyc";

export const demoBorrowerOtherKycs: Record<string, BorrowerOtherKyc[]> = {
  "B-1001": [
    {
      borrowerId: "B-1001",
      kycId: "OT-1001",
      documentType: "Other document",
      documentDescription: "Additional supporting file.",
      storageRefs: [],
      isApproved: undefined,
      isWaived: false,
      createdAt: "2025-12-20"
    }
  ]
};
