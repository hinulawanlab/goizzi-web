import type { BorrowerProofOfBillingKyc } from "@/shared/types/kyc";

export const demoBorrowerProofOfBillingKycs: Record<string, BorrowerProofOfBillingKyc[]> = {
  "B-1001": [
    {
      borrowerId: "B-1001",
      kycId: "POB-1001",
      documentType: "Electric bill",
      storageRefs: [],
      isApproved: undefined,
      createdAt: "2025-12-20"
    }
  ]
};
