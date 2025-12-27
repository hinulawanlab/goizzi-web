"use client";

import BorrowerKycDocumentPanel from "@/components/borrowers/BorrowerKycDocumentPanel";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { BorrowerPayslipKyc } from "@/shared/types/kyc";

interface BorrowerPayslipPanelProps {
  borrowerId: string;
  applicationId: string;
  kycs: BorrowerPayslipKyc[];
  onDecisionNoteAdded?: (note: BorrowerNote) => void;
}

export default function BorrowerPayslipPanel({
  borrowerId,
  applicationId,
  kycs,
  onDecisionNoteAdded
}: BorrowerPayslipPanelProps) {
  return (
    <BorrowerKycDocumentPanel
      borrowerId={borrowerId}
      applicationId={applicationId}
      title="Payslips"
      sectionLabel="Payslip"
      decisionLabel="Payslips"
      emptyTitle="No payslips yet"
      emptyMessage="Payslip uploads will appear once submitted."
      contextLabel="Payslip image"
      kycs={kycs}
      metadataFields={[{ label: "Employer", value: (entry) => entry.employer }]}
      onDecisionNoteAdded={onDecisionNoteAdded}
    />
  );
}
