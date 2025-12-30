"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import BorrowerLoanHeaderSection from "@/components/borrowers/BorrowerLoanHeaderSection";
import BorrowerLoanNotesActions from "@/components/borrowers/BorrowerLoanNotesActions";
import BorrowerLoanTabSection from "@/components/borrowers/BorrowerLoanTabSection";
import { useBorrowerLoanActions } from "@/components/borrowers/useBorrowerLoanActions";
import type { BorrowerLoanTabKey } from "@/components/borrowers/borrowerLoanTypes";
import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LoanSummary } from "@/shared/types/loan";
import type { RepaymentScheduleEntry } from "@/shared/types/repaymentSchedule";

interface BorrowerLoanTabsProps {
  borrower: BorrowerSummary;
  loan: LoanSummary;
  repaymentSchedule: RepaymentScheduleEntry[];
}

export default function BorrowerLoanTabs({ borrower, loan, repaymentSchedule }: BorrowerLoanTabsProps) {
  const [activeTab, setActiveTab] = useState<BorrowerLoanTabKey>("details");
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
        <div className="lg:flex-1 lg:overflow-y-auto lg:pr-2 pb-4">
          <BorrowerLoanTabSection
            activeTab={activeTab}
            borrower={borrower}
            loan={loan}
            repaymentSchedule={repaymentSchedule}
          />
        </div>
      </div>
    </div>
  );
}
