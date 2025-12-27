// src/components/borrowers/BorrowerApplicationTabs.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import BorrowerApplicationHeaderSection from "@/components/borrowers/BorrowerApplicationHeaderSection";
import BorrowerApplicationNotesActions from "@/components/borrowers/BorrowerApplicationNotesActions";
import BorrowerApplicationTabSection from "@/components/borrowers/BorrowerApplicationTabSection";
import { useBorrowerApplicationActions } from "@/components/borrowers/useBorrowerApplicationActions";
import type { TabKey } from "@/components/borrowers/borrowerApplicationTypes";
import { auth } from "@/shared/singletons/firebase";
import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { BorrowerReference } from "@/shared/types/borrowerReference";
import type {
  BorrowerBankStatementKyc,
  BorrowerOtherKyc,
  BorrowerPayslipKyc,
  BorrowerProofOfBillingKyc,
  BorrowerPropertyTitleKyc
} from "@/shared/types/kyc";
import type { LoanApplication } from "@/shared/types/loanApplication";
import type { BorrowerNote } from "@/shared/types/borrowerNote";

interface BorrowerApplicationTabsProps {
  borrower: BorrowerSummary;
  application: LoanApplication;
  references: BorrowerReference[];
  proofOfBillingKycs: BorrowerProofOfBillingKyc[];
  bankStatementKycs: BorrowerBankStatementKyc[];
  payslipKycs: BorrowerPayslipKyc[];
  propertyTitleKycs: BorrowerPropertyTitleKyc[];
  otherKycs: BorrowerOtherKyc[];
  notes: BorrowerNote[];
}

export default function BorrowerApplicationTabs({
  borrower,
  application,
  references,
  proofOfBillingKycs,
  bankStatementKycs,
  payslipKycs,
  propertyTitleKycs,
  otherKycs,
  notes
}: BorrowerApplicationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("maker");
  const [refreshTokensByTab, setRefreshTokensByTab] = useState<Record<TabKey, number>>({
    maker: 0,
    comakers: 0,
    references: 0,
    proof: 0,
    bankStatements: 0,
    payslips: 0,
    propertyTitles: 0,
    otherDocuments: 0,
    audit: 0
  });
  const [isRefreshing, startRefreshing] = useTransition();
  const router = useRouter();
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

  const handleRefresh = () => {
    startRefreshing(() => {
      setRefreshTokensByTab((prev) => ({
        ...prev,
        [activeTab]: (prev[activeTab] ?? 0) + 1
      }));
      router.refresh();
    });
  };

  return (
    <div className="relative flex flex-col gap-6 lg:min-h-[calc(100vh-4rem)] lg:pl-72 lg:pr-6">
      <div className="lg:fixed lg:left-4 lg:top-8 lg:bottom-8 lg:z-20 lg:w-72">
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

      <div className="pl-4 flex flex-col gap-6 lg:h-[calc(100vh-4rem)]">
        <BorrowerApplicationHeaderSection
          activeTab={activeTab}
          loanStatus={auditStatus}
          onTabChange={setActiveTab}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div className="lg:flex-1 lg:overflow-y-auto lg:pr-2 pb-4">
          <BorrowerApplicationTabSection
            activeTab={activeTab}
            borrower={borrower}
          application={application}
          references={references}
          proofOfBillingKycs={proofOfBillingKycs}
          bankStatementKycs={bankStatementKycs}
          payslipKycs={payslipKycs}
          propertyTitleKycs={propertyTitleKycs}
          otherKycs={otherKycs}
          refreshTokensByTab={refreshTokensByTab}
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
