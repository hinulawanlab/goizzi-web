// src/components/borrowers/BorrowerApplicationTabs.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

import BorrowerApplicationHeaderSection from "@/components/borrowers/BorrowerApplicationHeaderSection";
import BorrowerApplicationNotesActions from "@/components/borrowers/BorrowerApplicationNotesActions";
import BorrowerApplicationTabSection from "@/components/borrowers/BorrowerApplicationTabSection";
import BorrowerApplicationApprovalModal from "@/components/borrowers/BorrowerApplicationApprovalModal";
import BorrowerApplicationChecklistModal from "@/components/borrowers/BorrowerApplicationChecklistModal";
import { useBorrowerApplicationActions } from "@/components/borrowers/useBorrowerApplicationActions";
import type { LoanAction, TabKey } from "@/components/borrowers/borrowerApplicationTypes";
import { auth } from "@/shared/singletons/firebase";
import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { BorrowerReference } from "@/shared/types/borrowerReference";
import type {
  BorrowerBankStatementKyc,
  BorrowerOtherKyc,
  BorrowerPayslipKyc,
  BorrowerProofOfBillingKyc,
  BorrowerPropertyTitleKyc,
  BorrowerGovernmentIdKyc,
  BorrowerHomePhotoKyc
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
  selfieKycs: BorrowerGovernmentIdKyc[];
  governmentIdKycs: BorrowerGovernmentIdKyc[];
  homePhotoKycs: BorrowerHomePhotoKyc[];
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
  selfieKycs,
  governmentIdKycs,
  homePhotoKycs,
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
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [manualVerified, setManualVerified] = useState<string[]>(application.manualVerified ?? []);
  const [manualChecklistState, setManualChecklistState] = useState<"idle" | "working" | "success" | "error">("idle");
  const [manualChecklistMessage, setManualChecklistMessage] = useState("");
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
    handleStatusChange,
    handleApproveLoan,
    resetStatusAction
  } = useBorrowerApplicationActions({
    borrowerId: borrower.borrowerId,
    applicationId: application.applicationId,
    initialStatus: application.status,
    initialUpdatedAt: application.updatedAt,
    initialStatusUpdatedByName: application.statusUpdatedByName,
    initialNotes: notes
  });

  const parseNumberString = (value?: string): string | undefined => {
    if (!value) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toString() : undefined;
  };

  const defaultLoanAmount = parseNumberString(application.loanDetails?.amountApplied);
  const defaultTermMonths = parseNumberString(application.loanDetails?.term);
  const defaultApprovedAt = new Date().toISOString().split("T")[0];
  const loanAmountNumber = Number(application.loanDetails?.amountApplied);
  const isCibiOptional = Number.isFinite(loanAmountNumber) && loanAmountNumber < 50000;

  const resolveApprovedOrWaived = (value?: boolean, waived?: boolean) => value === true || waived === true;

  const hasSelfie = selfieKycs.some((entry) => resolveApprovedOrWaived(entry.isApproved));
  const hasGovernmentId = governmentIdKycs.some((entry) => resolveApprovedOrWaived(entry.isApproved));
  const hasProofOfIncome = payslipKycs.some((entry) => resolveApprovedOrWaived(entry.isApproved, entry.isWaived));
  const hasBankStatements = bankStatementKycs.some((entry) => resolveApprovedOrWaived(entry.isApproved, entry.isWaived));
  const hasProofOfBilling = proofOfBillingKycs.some((entry) => resolveApprovedOrWaived(entry.isApproved, entry.isWaived));
  const hasHomePhoto = homePhotoKycs.some((entry) => resolveApprovedOrWaived(entry.isApproved, entry.isWaived));

  const agreedReferences = references.filter(
    (reference) =>
      reference.contactStatus === "agreed" && reference.applicationId === application.applicationId
  );
  const hasReferences = agreedReferences.length >= 2;

  const manualItems = [
    { key: "homeAddress", label: "Home address", required: true },
    { key: "officeAddress", label: "Office address", required: true },
    { key: "loanApplication", label: "Loan application", required: true },
    { key: "makerFacebook", label: "Maker's facebook", required: true },
    { key: "makerMobile", label: "Maker's mobile number", required: true },
    { key: "comakerFacebook", label: "Co-maker's facebook", required: true },
    { key: "comakerMobile", label: "Co-maker's mobile number", required: true },
    { key: "cibi", label: "CIBI", required: !isCibiOptional }
  ];

  const autoChecklistItems = [
    { key: "selfie", label: "Selfie", checked: hasSelfie },
    { key: "governmentId", label: "Government ID", checked: hasGovernmentId },
    { key: "proofOfIncome", label: "Proof of income", checked: hasProofOfIncome },
    { key: "bankStatements", label: "Bank statements", checked: hasBankStatements },
    { key: "proofOfBilling", label: "Proof of billing", checked: hasProofOfBilling },
    { key: "references", label: "References", checked: hasReferences },
    { key: "homePhoto", label: "Home photo", checked: hasHomePhoto }
  ];

  const manualChecklistItems = manualItems.map((item) => ({
    ...item,
    checked: manualVerified.includes(item.key)
  }));

  const allAutoComplete = autoChecklistItems.every((item) => item.checked);
  const allManualRequiredComplete = manualChecklistItems.every(
    (item) => item.checked || item.required === false
  );
  const isChecklistComplete = allAutoComplete && allManualRequiredComplete;

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

  const handleStatusAction = (status: LoanAction) => {
    if (status === "Approve") {
      resetStatusAction();
      setManualChecklistState("idle");
      setManualChecklistMessage("");
      setIsApprovalOpen(true);
      return;
    }
    void handleStatusChange(status);
  };

  const handleManualToggle = async (key: string, checked: boolean) => {
    if (!borrower.borrowerId || !application.applicationId) {
      setManualChecklistState("error");
      setManualChecklistMessage("Borrower or application id is missing. Refresh and try again.");
      return;
    }

    setManualChecklistState("working");
    setManualChecklistMessage("Saving checklist...");

    const updated = checked
      ? Array.from(new Set([...manualVerified, key]))
      : manualVerified.filter((item) => item !== key);

    try {
      const response = await fetch(
        `/api/borrowers/${borrower.borrowerId}/application/${application.applicationId}/manual-checks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manualVerified: updated,
            actorUserId: auth.currentUser?.uid ?? null
          })
        }
      );

      if (!response.ok) {
        throw new Error("Manual checklist update failed.");
      }

      const payload = (await response.json()) as { manualVerified?: string[] };
      setManualVerified(payload.manualVerified ?? updated);
      setManualChecklistState("success");
      setManualChecklistMessage("Checklist saved.");
    } catch (error) {
      console.warn("Unable to update manual checklist:", error);
      setManualChecklistState("error");
      setManualChecklistMessage("Unable to save checklist. Please retry.");
    }
  };

  const handleApprovalSubmit = async (payload: {
    loanAmount: number;
    loanInterest: number;
    termMonths: number;
    approvedAt: string;
  }) => {
    const success = await handleApproveLoan(payload);
    if (success) {
      setIsApprovalOpen(false);
      router.push(`/borrowers/${borrower.borrowerId}`);
    }
    return success;
  };

  return (
    <div className="relative flex flex-col gap-6 lg:min-h-[calc(100vh-4rem)] lg:pl-72 lg:pr-6">
      <BorrowerApplicationApprovalModal
        key={`approval-${application.applicationId}-${isApprovalOpen ? "open" : "closed"}`}
        isOpen={isApprovalOpen}
        defaultAmount={defaultLoanAmount}
        defaultTerm={defaultTermMonths}
        defaultInterest={1.5}
        defaultApprovedAt={defaultApprovedAt}
        isChecklistComplete={isChecklistComplete}
        statusActionState={statusActionState}
        statusActionMessage={statusActionMessage}
        onClose={() => setIsApprovalOpen(false)}
        onSubmit={handleApprovalSubmit}
      />
      <BorrowerApplicationChecklistModal
        isOpen={isApprovalOpen}
        autoItems={autoChecklistItems}
        manualItems={manualChecklistItems}
        checklistState={manualChecklistState}
        checklistMessage={manualChecklistMessage}
        onToggleManualItem={handleManualToggle}
      />
      <div className="lg:fixed lg:left-4 lg:top-8 lg:bottom-8 lg:z-20 lg:w-72">
        <BorrowerApplicationNotesActions
          noteText={noteText}
          noteActionState={noteActionState}
          noteActionMessage={noteActionMessage}
          statusActionState={statusActionState}
          statusActionMessage={statusActionMessage}
          onNoteTextChange={handleNoteTextChange}
          onAddNote={handleAddNote}
          onStatusChange={handleStatusAction}
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
