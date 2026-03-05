// src/components/borrowers/BorrowerPayslipPanel.tsx
"use client";

import BorrowerKycDocumentPanel from "@/components/borrowers/BorrowerKycDocumentPanel";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { BorrowerPayslipKyc } from "@/shared/types/kyc";

interface BorrowerPayslipPanelProps {
  borrowerId: string;
  applicationId: string;
  kycs: BorrowerPayslipKyc[];
  enableImagePrint?: boolean;
  disableDecisionActions?: boolean;
  onDecisionNoteAdded?: (note: BorrowerNote) => void;
  onDecisionComplete?: () => void;
}

export default function BorrowerPayslipPanel({
  borrowerId,
  applicationId,
  kycs,
  enableImagePrint = false,
  disableDecisionActions = false,
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
      enableImagePrint={enableImagePrint}
      printHeading="Income Source"
      disableDecisionActions={disableDecisionActions}
      metadataFields={[{ label: "Employer", value: (entry) => entry.employer }]}
      onDecisionNoteAdded={onDecisionNoteAdded}
      onDecisionComplete={onDecisionComplete}
    />
  );
}
