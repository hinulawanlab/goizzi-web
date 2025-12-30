"use client";

import BorrowerKycDocumentPanel from "@/components/borrowers/BorrowerKycDocumentPanel";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { BorrowerOtherKyc } from "@/shared/types/kyc";

interface BorrowerOtherDocumentPanelProps {
  borrowerId: string;
  applicationId: string;
  kycs: BorrowerOtherKyc[];
  onDecisionNoteAdded?: (note: BorrowerNote) => void;
  onDecisionComplete?: () => void;
}

export default function BorrowerOtherDocumentPanel({
  borrowerId,
  applicationId,
  kycs,
  onDecisionNoteAdded,
  onDecisionComplete
}: BorrowerOtherDocumentPanelProps) {
  return (
    <BorrowerKycDocumentPanel
      borrowerId={borrowerId}
      applicationId={applicationId}
      title="Other documents"
      sectionLabel="Other document"
      decisionLabel="Other documents"
      emptyTitle="No other documents yet"
      emptyMessage="Other document uploads will appear once submitted."
      contextLabel="Other document image"
      kycs={kycs}
      metadataFields={[
        { label: "Description", value: (entry) => entry.documentDescription }
      ]}
      onDecisionNoteAdded={onDecisionNoteAdded}
      onDecisionComplete={onDecisionComplete}
    />
  );
}
