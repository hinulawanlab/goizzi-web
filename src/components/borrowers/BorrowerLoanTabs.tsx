"use client";

import { useEffect, useMemo, useTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import BorrowerLoanHeaderSection from "@/components/borrowers/BorrowerLoanHeaderSection";
import BorrowerLoanNotesActions from "@/components/borrowers/BorrowerLoanNotesActions";
import BorrowerLoanTabSection from "@/components/borrowers/BorrowerLoanTabSection";
import { useBorrowerLoanActions } from "@/components/borrowers/useBorrowerLoanActions";
import { isBorrowerLoanTabKey, type BorrowerLoanTabKey } from "@/components/borrowers/borrowerLoanTypes";
import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LoanSummary } from "@/shared/types/loan";
import type { RepaymentScheduleEntry } from "@/shared/types/repaymentSchedule";
import type { LoanNote } from "@/shared/types/loanNote";
import type { LoanProductSummary } from "@/shared/types/product";

interface BorrowerLoanTabsProps {
  borrower: BorrowerSummary;
  loan: LoanSummary;
  repaymentSchedule: RepaymentScheduleEntry[];
  loanNotes: LoanNote[];
  loanNotesError?: string;
  loanProducts: LoanProductSummary[];
}

export default function BorrowerLoanTabs({
  borrower,
  loan,
  repaymentSchedule,
  loanNotes,
  loanNotesError,
  loanProducts
}: BorrowerLoanTabsProps) {
  const searchParams = useSearchParams();
  const resolvedTab = useMemo(() => {
    const paramTab = searchParams.get("tab");
    return isBorrowerLoanTabKey(paramTab) ? paramTab : "details";
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<BorrowerLoanTabKey>(resolvedTab);
  const [isRefreshing, startRefreshing] = useTransition();
  const router = useRouter();
  const {
    noteText,
    noteActionState,
    noteActionMessage,
    actionState,
    actionMessage,
    handleNoteTextChange,
    handleAddNote,
    handleSendNote,
    handleAction
  } = useBorrowerLoanActions({
    borrowerId: borrower.borrowerId,
    loanId: loan.loanId,
    applicationId: loan.applicationId
  });

  const handleRefresh = () => {
    startRefreshing(() => {
      router.refresh();
    });
  };

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  return (
    <div className="relative flex flex-col gap-6 lg:min-h-[calc(100vh-4rem)] lg:pl-72 lg:pr-6">
      <div className="lg:fixed lg:left-4 lg:top-8 lg:bottom-8 lg:z-20 lg:w-72">
        <BorrowerLoanNotesActions
          noteText={noteText}
          noteActionState={noteActionState}
          noteActionMessage={noteActionMessage}
          actionState={actionState}
          actionMessage={actionMessage}
          onNoteTextChange={handleNoteTextChange}
          onAddNote={handleAddNote}
          onSendNote={handleSendNote}
          onAction={handleAction}
        />
      </div>

      <div className="pl-4 flex flex-col gap-6 lg:h-[calc(100vh-4rem)]">
        <BorrowerLoanHeaderSection
          activeTab={activeTab}
          borrowerName={borrower.fullName}
          loanStatus={loan.status}
          onTabChange={setActiveTab}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div
          className={`lg:flex-1 lg:pr-2 pb-4 ${activeTab === "payments" ? "lg:overflow-hidden" : "lg:overflow-y-auto"}`}
        >
          <BorrowerLoanTabSection
            activeTab={activeTab}
            borrower={borrower}
            loan={loan}
            repaymentSchedule={repaymentSchedule}
            loanNotes={loanNotes}
            loanNotesError={loanNotesError}
            loanProducts={loanProducts}
          />
        </div>
      </div>
    </div>
  );
}
