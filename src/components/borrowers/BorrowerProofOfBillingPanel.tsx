"use client";

import BorrowerKycDocumentPanel from "@/components/borrowers/BorrowerKycDocumentPanel";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { BorrowerProofOfBillingKyc } from "@/shared/types/kyc";

interface BorrowerProofOfBillingPanelProps {
  borrowerId: string;
  applicationId: string;
  kycs: BorrowerProofOfBillingKyc[];
  onDecisionNoteAdded?: (note: BorrowerNote) => void;
  onDecisionComplete?: () => void;
}

export default function BorrowerProofOfBillingPanel({
  borrowerId,
  applicationId,
  kycs,
  onDecisionNoteAdded,
  onDecisionComplete
}: BorrowerProofOfBillingPanelProps) {
  return (
    <BorrowerKycDocumentPanel
      borrowerId={borrowerId}
      applicationId={applicationId}
      title="Proof of billing"
      sectionLabel="Proof of billing"
      decisionLabel="Proof of billing"
      emptyTitle="No proof of billing yet"
      emptyMessage="Proof of billing submissions will appear once uploaded."
      contextLabel="Proof of billing image"
      kycs={kycs}
      onDecisionNoteAdded={onDecisionNoteAdded}
      onDecisionComplete={onDecisionComplete}
    />
  );
}
