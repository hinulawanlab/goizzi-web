// src/components/borrowers/BorrowerPayslipPanel.tsx
"use client";

import BorrowerKycDocumentPanel from "@/components/borrowers/BorrowerKycDocumentPanel";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { BorrowerPayslipKyc } from "@/shared/types/kyc";

interface BorrowerPayslipPanelProps {
  borrowerId: string;
  applicationId: string;
  kycs: BorrowerPayslipKyc[];
  onDecisionNoteAdded?: (note: BorrowerNote) => void;
  onDecisionComplete?: () => void;
}

export default function BorrowerPayslipPanel({
  borrowerId,
  applicationId,
  kycs,
  onDecisionNoteAdded,
  onDecisionComplete
}: BorrowerPayslipPanelProps) {
  return (
    <BorrowerKycDocumentPanel
      borrowerId={borrowerId}
      applicationId={applicationId}
      title="Payslips"
      sectionLabel="Source of Income"
      decisionLabel="Payslips"
      emptyTitle="No payslips yet"
      emptyMessage="Payslip uploads will appear once submitted."
      contextLabel="Payslip image"
      kycs={kycs}
      metadataFields={[{ label: "Employer", value: (entry) => entry.employer }]}
      onDecisionNoteAdded={onDecisionNoteAdded}
      onDecisionComplete={onDecisionComplete}
    />
  );
}
