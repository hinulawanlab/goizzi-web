"use client";

import BorrowerKycDocumentPanel from "@/components/borrowers/BorrowerKycDocumentPanel";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { BorrowerBankStatementKyc } from "@/shared/types/kyc";

interface BorrowerBankStatementPanelProps {
  borrowerId: string;
  applicationId: string;
  kycs: BorrowerBankStatementKyc[];
  enableImagePrint?: boolean;
  disableDecisionActions?: boolean;
  onDecisionNoteAdded?: (note: BorrowerNote) => void;
  onDecisionComplete?: () => void;
}

export default function BorrowerBankStatementPanel({
  borrowerId,
  applicationId,
  kycs,
  enableImagePrint = false,
  disableDecisionActions = false,
  onDecisionNoteAdded,
  onDecisionComplete
}: BorrowerBankStatementPanelProps) {
  return (
    <BorrowerKycDocumentPanel
      borrowerId={borrowerId}
      applicationId={applicationId}
      title="Bank statements"
      sectionLabel="Bank statement"
      decisionLabel="Bank statements"
      emptyTitle="No bank statements yet"
      emptyMessage="Bank statement uploads will appear once submitted."
      contextLabel="Bank statement image"
      kycs={kycs}
      enableImagePrint={enableImagePrint}
      printHeading="Bank Records"
      disableDecisionActions={disableDecisionActions}
      metadataFields={[
        { label: "Bank name", value: (entry) => entry.bankName },
        { label: "Account name", value: (entry) => entry.accountName },
        { label: "Account number", value: (entry) => entry.accountNumber }
      ]}
      onDecisionNoteAdded={onDecisionNoteAdded}
      onDecisionComplete={onDecisionComplete}
    />
  );
}
