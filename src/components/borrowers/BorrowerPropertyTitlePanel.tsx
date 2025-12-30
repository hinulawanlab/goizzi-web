"use client";

import BorrowerKycDocumentPanel from "@/components/borrowers/BorrowerKycDocumentPanel";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { BorrowerPropertyTitleKyc } from "@/shared/types/kyc";

interface BorrowerPropertyTitlePanelProps {
  borrowerId: string;
  applicationId: string;
  kycs: BorrowerPropertyTitleKyc[];
  onDecisionNoteAdded?: (note: BorrowerNote) => void;
  onDecisionComplete?: () => void;
}

export default function BorrowerPropertyTitlePanel({
  borrowerId,
  applicationId,
  kycs,
  onDecisionNoteAdded,
  onDecisionComplete
}: BorrowerPropertyTitlePanelProps) {
  return (
    <BorrowerKycDocumentPanel
      borrowerId={borrowerId}
      applicationId={applicationId}
      title="Property titles"
      sectionLabel="Property title"
      decisionLabel="Property titles"
      emptyTitle="No property titles yet"
      emptyMessage="Property title uploads will appear once submitted."
      contextLabel="Property title image"
      kycs={kycs}
      onDecisionNoteAdded={onDecisionNoteAdded}
      onDecisionComplete={onDecisionComplete}
    />
  );
}
