// src/components/borrowers/BorrowerApplicationTabSection.tsx
"use client";

import { useMemo, useState } from "react";

import BorrowerBankStatementPanel from "@/components/borrowers/BorrowerBankStatementPanel";
import BorrowerOtherDocumentPanel from "@/components/borrowers/BorrowerOtherDocumentPanel";
import BorrowerPayslipPanel from "@/components/borrowers/BorrowerPayslipPanel";
import BorrowerPropertyTitlePanel from "@/components/borrowers/BorrowerPropertyTitlePanel";
import BorrowerProofOfBillingPanel from "@/components/borrowers/BorrowerProofOfBillingPanel";
import type { TabKey } from "@/components/borrowers/borrowerApplicationTypes";
import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { BorrowerReference, ReferenceContactStatus } from "@/shared/types/borrowerReference";
import type {
  BorrowerBankStatementKyc,
  BorrowerOtherKyc,
  BorrowerPayslipKyc,
  BorrowerProofOfBillingKyc,
  BorrowerPropertyTitleKyc
} from "@/shared/types/kyc";
import type { LoanApplication } from "@/shared/types/loanApplication";
import type { BorrowerNote } from "@/shared/types/borrowerNote";

type ActionState = "idle" | "working" | "success" | "error";

interface BorrowerApplicationTabSectionProps {
  activeTab: TabKey;
  borrower: BorrowerSummary;
  application: LoanApplication;
  references: BorrowerReference[];
  proofOfBillingKycs: BorrowerProofOfBillingKyc[];
  bankStatementKycs: BorrowerBankStatementKyc[];
  payslipKycs: BorrowerPayslipKyc[];
  propertyTitleKycs: BorrowerPropertyTitleKyc[];
  otherKycs: BorrowerOtherKyc[];
  refreshTokensByTab: Record<TabKey, number>;
  auditStatus: string;
  auditUpdatedAt?: string;
  statusUpdatedByName?: string;
  noteEntries: BorrowerNote[];
  onDecisionNoteAdded: (note: BorrowerNote) => void;
}

const contactStatusLabels: Record<ReferenceContactStatus, string> = {
  pending: "Pending outreach",
  agreed: "Agreed to be reference",
  declined: "Contacted, did not agree",
  no_response: "No response / cannot be reached"
};

const contactActions: { value: ReferenceContactStatus; label: string }[] = [
  { value: "agreed", label: "Agreed" },
  { value: "declined", label: "Did not agree" },
  { value: "no_response", label: "No response" }
];

function formatDate(value?: string) {
  if (!value || value === "N/A") {
    return "N/A";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(value?: string) {
  if (!value || value === "N/A") {
    return "N/A";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatAmount(value?: string) {
  if (!value || value === "N/A") {
    return "N/A";
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  const formatted = parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `Php ${formatted}`;
}

function DetailRow({ label, value }: { label: string; value?: string | boolean }) {
  const displayValue = typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "N/A";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{displayValue}</p>
    </div>
  );
}

export default function BorrowerApplicationTabSection({
  activeTab,
  borrower,
  application,
  references,
  proofOfBillingKycs,
  bankStatementKycs,
  payslipKycs,
  propertyTitleKycs,
  otherKycs,
  refreshTokensByTab,
  auditStatus,
  auditUpdatedAt,
  statusUpdatedByName,
  noteEntries,
  onDecisionNoteAdded
}: BorrowerApplicationTabSectionProps) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ReferenceContactStatus>>({});
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});

  const referencesById = useMemo(() => {
    const mapping: Record<string, BorrowerReference> = {};
    references.forEach((reference) => {
      mapping[reference.referenceId] = reference;
    });
    return mapping;
  }, [references]);

  const getReferenceStatus = (referenceId: string): ReferenceContactStatus => {
    return statusOverrides[referenceId] ?? referencesById[referenceId]?.contactStatus ?? "pending";
  };

  const updateReferenceStatus = async (referenceId: string, contactStatus: ReferenceContactStatus) => {
    if (!borrower?.borrowerId) {
      setActionStates((prev) => ({ ...prev, [referenceId]: "error" }));
      setActionMessages((prev) => ({
        ...prev,
        [referenceId]: "Borrower id is missing. Refresh and try again."
      }));
      return;
    }

    setActionStates((prev) => ({ ...prev, [referenceId]: "working" }));
    setActionMessages((prev) => ({ ...prev, [referenceId]: "Updating reference status..." }));

    try {
      const response = await fetch(
        `/api/borrowers/${borrower.borrowerId}/references/${referenceId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactStatus })
        }
      );

      if (!response.ok) {
        throw new Error("Status update failed.");
      }

      setStatusOverrides((prev) => ({ ...prev, [referenceId]: contactStatus }));
      setActionStates((prev) => ({ ...prev, [referenceId]: "success" }));
      setActionMessages((prev) => ({
        ...prev,
        [referenceId]: `Status updated to "${contactStatusLabels[contactStatus]}".`
      }));
    } catch (error) {
      console.warn("Unable to update reference status:", error);
      setActionStates((prev) => ({ ...prev, [referenceId]: "error" }));
      setActionMessages((prev) => ({ ...prev, [referenceId]: "Unable to update status. Please retry." }));
    }
  };

  return (
    <>
      {activeTab === "maker" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {(application.borrower.fullName ?? borrower.fullName)?.toUpperCase()}
            </p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Nickname" value={application.borrower.nickname} />
              <DetailRow label="Age" value={application.borrower.age} />
              <DetailRow label="Gender" value={application.borrower.gender} />
              <DetailRow label="Birthplace" value={application.borrower.birthplace} />
              <DetailRow label="Mobile" value={application.borrower.mobileNumber} />
              <DetailRow label="Email" value={application.borrower.email} />
              <DetailRow label="Citizenship" value={application.borrower.citizenship} />
              <DetailRow label="Date of birth" value={application.borrower.dateOfBirth} />
              <DetailRow label="Civil status" value={application.borrower.civilStatus} />
              <DetailRow label="Dependents" value={application.borrower.dependents} />
              <DetailRow label="Education attainment" value={application.borrower.educationAttainment} />
              <DetailRow label="Course" value={application.borrower.course} />
              <DetailRow label="Father's name" value={application.borrower.fatherName} />
              <DetailRow label="Mother's maiden name" value={application.borrower.motherMaidenName} />
              <DetailRow label="Home ownership" value={application.borrower.homeOwnership} />
              <DetailRow label="Current address" value={application.borrower.currentAddress} />
              <DetailRow label="Years at address" value={application.borrower.yearsAtAddress} />
              <DetailRow label="Provincial address" value={application.borrower.provincialAddress} />
              <DetailRow label="Provincial same as current" value={application.borrower.provincialSameAsCurrent} />
              <DetailRow label="Facebook account" value={application.borrower.facebookAccountName} />
              <DetailRow label="Marketing source" value={application.marketing?.source} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-md font-medium uppercase tracking-[0.3em] text-slate-600">Loan details</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Loan type" value={application.loanDetails?.productName} />
              <DetailRow label="Loan category" value={application.loanDetails?.productId} />
              <DetailRow
                label="Amount applied (in Pesos)"
                value={formatAmount(application.loanDetails?.amountApplied)}
              />
              <DetailRow label="Term (in months)" value={application.loanDetails?.term} />
              <DetailRow label="Purpose" value={application.loanDetails?.purpose} />
              <DetailRow label="Submitted" value={formatDate(application.submittedAt ?? application.createdAt)} />
              <DetailRow label="Loan status" value={auditStatus} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-md font-medium uppercase tracking-[0.3em] text-slate-600">Source of income details</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Employer / Business Name" value={application.borrowerIncome?.employerName} />
              <DetailRow label="Employer address" value={application.borrowerIncome?.employerAddress} />
              <DetailRow label="Employer contact" value={application.borrowerIncome?.employerContact} />
              <DetailRow label="Source" value={application.borrowerIncome?.occupation} />
              <DetailRow label="Net income (in Pesos)" value={formatAmount(application.borrowerIncome?.netIncome)} />
              <DetailRow label="Number of years employed or in business" value={application.borrowerIncome?.yearsInRole} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-md font-medium uppercase tracking-[0.3em] text-slate-600">Spouse details</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Full name" value={application.spouse?.fullName} />
              <DetailRow label="Nickname" value={application.spouse?.nickname} />
              <DetailRow label="Address" value={application.spouse?.address} />
              <DetailRow label="Employer / Business Name" value={application.spouse?.employerName} />
              <DetailRow label="Employer contact" value={application.spouse?.employerContact} />
              <DetailRow label="Source of income" value={application.spouse?.occupation} />
              <DetailRow label="Net income (in Pesos)" value={formatAmount(application.spouse?.netIncome)} />
              <DetailRow label="Number of years employed or in business" value={application.spouse?.yearsInRole} />
              <DetailRow label="Mobile" value={application.spouse?.contactNumber} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-md font-medium uppercase tracking-[0.3em] text-slate-600">Assets & estimated value</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Assets" value={application.borrowerAssets?.selections?.join(", ")} />
              <DetailRow label="Asset details" value={application.borrowerAssets?.details} />
              <DetailRow
                label="Estimated value (in Pesos)"
                value={formatAmount(application.borrowerAssets?.estimatedValue)}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "comakers" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {application.coMaker?.fullName?.toUpperCase()}
            </p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Nickname" value={application.coMaker?.nickname} />
              <DetailRow label="Age" value={application.coMaker?.age} />
              <DetailRow label="Citizenship" value={application.coMaker?.citizenship} />
              <DetailRow label="Civil status" value={application.coMaker?.civilStatus} />
              <DetailRow label="Relationship" value={application.coMaker?.relationshipToBorrower} />
              <DetailRow label="Mobile" value={application.coMaker?.mobileNumber} />
              <DetailRow label="Email" value={application.coMaker?.email} />
              <DetailRow label="Address" value={application.coMaker?.currentAddress} />
              <DetailRow label="Provincial address" value={application.coMaker?.provincialAddress} />
              <DetailRow label="Years at address" value={application.coMaker?.yearsAtAddress} />
              <DetailRow label="Dependents" value={application.coMaker?.dependents} />
              <DetailRow label="Home ownership" value={application.coMaker?.homeOwnership} />
              <DetailRow label="Facebook account" value={application.coMaker?.facebookAccountName} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-md font-medium uppercase tracking-[0.3em] text-slate-600">Co-maker source of income</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Employer / Business Name" value={application.coMakerIncome?.employerName} />
              <DetailRow label="Employer address" value={application.coMakerIncome?.employerAddress} />
              <DetailRow label="Employer contact" value={application.coMakerIncome?.employerContact} />
              <DetailRow label="Net income (in Pesos)" value={formatAmount(application.coMakerIncome?.netIncome)} />
              <DetailRow label="Source" value={application.coMakerIncome?.occupation} />
              <DetailRow label="Number of years employed or in business" value={application.coMakerIncome?.yearsInRole} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "bankStatements" && (
        <BorrowerBankStatementPanel
          key={`bankStatements-${refreshTokensByTab.bankStatements}`}
          borrowerId={borrower.borrowerId}
          applicationId={application.applicationId}
          kycs={bankStatementKycs}
          onDecisionNoteAdded={onDecisionNoteAdded}
        />
      )}

      {activeTab === "payslips" && (
        <BorrowerPayslipPanel
          key={`payslips-${refreshTokensByTab.payslips}`}
          borrowerId={borrower.borrowerId}
          applicationId={application.applicationId}
          kycs={payslipKycs}
          onDecisionNoteAdded={onDecisionNoteAdded}
        />
      )}

      {activeTab === "propertyTitles" && (
        <BorrowerPropertyTitlePanel
          key={`propertyTitles-${refreshTokensByTab.propertyTitles}`}
          borrowerId={borrower.borrowerId}
          applicationId={application.applicationId}
          kycs={propertyTitleKycs}
          onDecisionNoteAdded={onDecisionNoteAdded}
        />
      )}

      {activeTab === "otherDocuments" && (
        <BorrowerOtherDocumentPanel
          key={`otherDocuments-${refreshTokensByTab.otherDocuments}`}
          borrowerId={borrower.borrowerId}
          applicationId={application.applicationId}
          kycs={otherKycs}
          onDecisionNoteAdded={onDecisionNoteAdded}
        />
      )}

      {activeTab === "references" && (
        <div className="space-y-4">
          {references.length ? (
            references.map((reference) => (
              <div key={reference.referenceId} className="rounded-3xl border border-slate-100 bg-white px-6 pb-6 pt-3 shadow-sm">
                <p className="mt-2 text-lg font-semibold text-slate-900">{reference.name}</p>
                <div className="mt-4 grid gap-3">
                  <DetailRow label="Mobile" value={reference.mobileNumber} />
                  <DetailRow label="Address" value={reference.address} />
                  <DetailRow label="Added" value={formatDate(reference.createdAt)} />
                  <DetailRow label="Contact status" value={contactStatusLabels[getReferenceStatus(reference.referenceId)]} />
                </div>
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reference check</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contactActions.map((action) => {
                      const actionState = actionStates[reference.referenceId] ?? "idle";
                      const isWorking = actionState === "working";
                      return (
                        <button
                          key={action.value}
                          type="button"
                          onClick={() => updateReferenceStatus(reference.referenceId, action.value)}
                          disabled={isWorking}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${isWorking
                            ? "cursor-not-allowed border-slate-200 text-slate-300"
                            : "cursor-pointer border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            }`}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                  {(actionStates[reference.referenceId] ?? "idle") === "working" && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                      {actionMessages[reference.referenceId] ?? "Updating status..."}
                    </div>
                  )}
                  {(actionStates[reference.referenceId] ?? "idle") === "success" &&
                    actionMessages[reference.referenceId] && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {actionMessages[reference.referenceId]}
                      </div>
                    )}
                  {(actionStates[reference.referenceId] ?? "idle") === "error" && actionMessages[reference.referenceId] && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {actionMessages[reference.referenceId]}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No references yet</p>
              <p className="mt-3 text-sm text-slate-600">Reference entries will appear once added.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "proof" && (
        <BorrowerProofOfBillingPanel
          key={`proof-${refreshTokensByTab.proof}`}
          borrowerId={borrower.borrowerId}
          applicationId={application.applicationId}
          kycs={proofOfBillingKycs}
          onDecisionNoteAdded={onDecisionNoteAdded}
        />
      )}

      {activeTab === "audit" && (
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Audit</p>
          <div className="mt-4 grid gap-3">
            <DetailRow label="Loan status" value={auditStatus} />
            <DetailRow label="Status updated by" value={statusUpdatedByName} />
            <DetailRow label="Date of application" value={formatDate(application.submittedAt)} />
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notes</p>
            <div className="mt-3 space-y-3">
              {noteEntries.length ? (
                noteEntries.map((note) => (
                  <div key={note.noteId} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap wrap-break-words">{note.note}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      {note.createdByName ?? "Unknown staff"} - {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No notes yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
