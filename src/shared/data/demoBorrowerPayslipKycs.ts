import type { BorrowerPayslipKyc } from "@/shared/types/kyc";

export const demoBorrowerPayslipKycs: Record<string, BorrowerPayslipKyc[]> = {
  "B-1001": [
    {
      borrowerId: "B-1001",
      kycId: "PS-1001",
      documentType: "Payslip",
      employer: "Demo Employer",
      storageRefs: [],
      isApproved: undefined,
      isWaived: false,
      createdAt: "2025-12-20"
    }
  ]
};
