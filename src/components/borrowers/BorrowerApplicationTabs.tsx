// src/components/borrowers/BorrowerApplicationTabs.tsx
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import BorrowerApplicationHeaderSection from "@/components/borrowers/BorrowerApplicationHeaderSection";
import BorrowerApplicationNotesActions from "@/components/borrowers/BorrowerApplicationNotesActions";
import BorrowerApplicationTabSection from "@/components/borrowers/BorrowerApplicationTabSection";
import { useBorrowerApplicationActions } from "@/components/borrowers/useBorrowerApplicationActions";
import type { TabKey } from "@/components/borrowers/borrowerApplicationTypes";
import { auth } from "@/shared/singletons/firebase";
import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { BorrowerReference } from "@/shared/types/borrowerReference";
import type { BorrowerProofOfBillingKyc } from "@/shared/types/kyc";
import type { LoanApplication } from "@/shared/types/loanApplication";
import type { BorrowerNote } from "@/shared/types/borrowerNote";

interface BorrowerApplicationTabsProps {
  borrower: BorrowerSummary;
  application: LoanApplication;
  references: BorrowerReference[];
  proofOfBillingKycs: BorrowerProofOfBillingKyc[];
  notes: BorrowerNote[];
}

export default function BorrowerApplicationTabs({
  borrower,
  application,
  references,
  proofOfBillingKycs,
  notes
}: BorrowerApplicationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("maker");
  const {
    auditStatus,
    auditUpdatedAt,
    statusUpdatedByName,
    noteEntries,
    noteText,
    noteActionState,
    noteActionMessage,
    statusActionState,
    statusActionMessage,
    handleAddNote,
    handleNoteTextChange,
    handleKycDecisionNote,
    handleStatusChange
  } = useBorrowerApplicationActions({
    borrowerId: borrower.borrowerId,
    applicationId: application.applicationId,
    initialStatus: application.status,
    initialUpdatedAt: application.updatedAt,
    initialStatusUpdatedByName: application.statusUpdatedByName,
    initialNotes: notes
  });

  useEffect(() => {
    console.info("Borrower application auth check.", {
      borrowerId: borrower.borrowerId,
      applicationId: application.applicationId,
      hasAuthUser: Boolean(auth.currentUser),
      userId: auth.currentUser?.uid ?? null
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.info("Borrower application auth state changed.", {
        borrowerId: borrower.borrowerId,
        applicationId: application.applicationId,
        hasAuthUser: Boolean(user),
        userId: user?.uid ?? null
      });
    });

    return unsubscribe;
  }, [application.applicationId, borrower.borrowerId]);

  return (
    <div className="relative flex flex-col gap-6 lg:min-h-[calc(100vh-4rem)] lg:pl-[18rem] lg:pr-6">
      <div className="lg:fixed lg:left-4 lg:top-8 lg:bottom-8 lg:z-20 lg:w-64">
        <BorrowerApplicationNotesActions
          noteText={noteText}
          noteActionState={noteActionState}
          noteActionMessage={noteActionMessage}
          statusActionState={statusActionState}
          statusActionMessage={statusActionMessage}
          onNoteTextChange={handleNoteTextChange}
          onAddNote={handleAddNote}
          onStatusChange={handleStatusChange}
        />
      </div>

      <div className="flex flex-col gap-6 lg:h-[calc(100vh-4rem)]">
        <BorrowerApplicationHeaderSection activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="lg:flex-1 lg:overflow-y-auto lg:pr-2">
          <BorrowerApplicationTabSection
            activeTab={activeTab}
            borrower={borrower}
            application={application}
            references={references}
            proofOfBillingKycs={proofOfBillingKycs}
            auditStatus={auditStatus}
            auditUpdatedAt={auditUpdatedAt}
            statusUpdatedByName={statusUpdatedByName}
            noteEntries={noteEntries}
            onDecisionNoteAdded={handleKycDecisionNote}
          />
        </div>
      </div>
    </div>
  );
}
