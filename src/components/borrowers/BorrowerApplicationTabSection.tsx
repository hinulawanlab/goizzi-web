"use client";

import { useMemo, useState } from "react";

import BorrowerProofOfBillingPanel from "@/components/borrowers/BorrowerProofOfBillingPanel";
import type { TabKey } from "@/components/borrowers/borrowerApplicationTypes";
import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { BorrowerReference, ReferenceContactStatus } from "@/shared/types/borrowerReference";
import type { BorrowerProofOfBillingKyc } from "@/shared/types/kyc";
import type { LoanApplication } from "@/shared/types/loanApplication";
import type { BorrowerNote } from "@/shared/types/borrowerNote";

type ActionState = "idle" | "working" | "success" | "error";

interface BorrowerApplicationTabSectionProps {
  activeTab: TabKey;
  borrower: BorrowerSummary;
  application: LoanApplication;
  references: BorrowerReference[];
  proofOfBillingKycs: BorrowerProofOfBillingKyc[];
  auditStatus: string;
  auditUpdatedAt?: string;
  statusUpdatedByName?: string;
  noteEntries: BorrowerNote[];
  onDecisionNoteAdded: (note: BorrowerNote) => void;
}

const documentGroups = [
  { title: "Bank statements", description: "Placeholder for bank statement uploads." },
  { title: "Payslips", description: "Placeholder for payslip uploads." },
  { title: "Property titles", description: "Placeholder for property title uploads." },
  { title: "Others", description: "Placeholder for other supporting documents." }
];

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

function formatAmount(value?: string) {
  if (!value || value === "N/A") {
    return "N/A";
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return parsed.toLocaleString("en-US");
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
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Borrower snapshot</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {application.borrower.fullName ?? borrower.fullName}
            </p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Mobile" value={application.borrower.mobileNumber} />
              <DetailRow label="Email" value={application.borrower.email} />
              <DetailRow label="Date of birth" value={application.borrower.dateOfBirth} />
              <DetailRow label="Civil status" value={application.borrower.civilStatus} />
              <DetailRow label="Current address" value={application.borrower.currentAddress} />
              <DetailRow label="Provincial same as current" value={application.borrower.provincialSameAsCurrent} />
              <DetailRow label="Marketing source" value={application.marketing?.source} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loan details</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Loan type" value={application.loanDetails?.productName} />
              <DetailRow label="Loan category" value={application.loanDetails?.productId} />
              <DetailRow label="Amount applied (in Pesos)" value={formatAmount(application.loanDetails?.amountApplied)} />
              <DetailRow label="Term (in months)" value={application.loanDetails?.term} />
              <DetailRow label="Purpose" value={application.loanDetails?.purpose} />
              <DetailRow label="Submitted" value={formatDate(application.submittedAt ?? application.createdAt)} />
              <DetailRow label="Loan status" value={auditStatus} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Source of income details</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Employer / Business Name" value={application.borrowerIncome?.employerName} />
              <DetailRow label="Source" value={application.borrowerIncome?.occupation} />
              <DetailRow label="Net income (in Pesos)" value={application.borrowerIncome?.netIncome} />
              <DetailRow label="Number of years employed or in business" value={application.borrowerIncome?.yearsInRole} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Spouse</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Full name" value={application.spouse?.fullName} />
              <DetailRow label="Source of income" value={application.spouse?.occupation} />
              <DetailRow label="Net income (in Pesos)" value={application.spouse?.netIncome} />
              <DetailRow label="Contact number" value={application.spouse?.contactNumber} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Assets & estimated value</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Assets" value={application.borrowerAssets?.selections?.join(", ")} />
              <DetailRow label="Estimated value (in Pesos)" value={application.borrowerAssets?.estimatedValue} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "comakers" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Co-maker</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Full name" value={application.coMaker?.fullName} />
              <DetailRow label="Relationship" value={application.coMaker?.relationshipToBorrower} />
              <DetailRow label="Mobile" value={application.coMaker?.mobileNumber} />
              <DetailRow label="Address" value={application.coMaker?.currentAddress} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Co-maker income</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Employer" value={application.coMakerIncome?.employerName} />
              <DetailRow label="Net income" value={application.coMakerIncome?.netIncome} />
              <DetailRow label="Occupation" value={application.coMakerIncome?.occupation} />
              <DetailRow label="Years in role" value={application.coMakerIncome?.yearsInRole} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="grid gap-4 md:grid-cols-2">
          {documentGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{group.title}</p>
              <p className="mt-3 text-sm text-slate-600">{group.description}</p>
              <p className="mt-2 text-xs text-slate-400">Logic will be added in a later iteration.</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "references" && (
        <div className="space-y-4">
          {references.length ? (
            references.map((reference) => (
              <div key={reference.referenceId} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reference</p>
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
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                            isWorking
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
            <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No references yet</p>
              <p className="mt-3 text-sm text-slate-600">Reference entries will appear once added.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "proof" && (
        <BorrowerProofOfBillingPanel
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
            <DetailRow label="Submitted" value={formatDate(application.submittedAt)} />
            <DetailRow label="Updated" value={formatDate(auditUpdatedAt)} />
            <DetailRow label="Loan status" value={auditStatus} />
            <DetailRow label="Status updated by" value={statusUpdatedByName} />
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notes</p>
            <div className="mt-3 space-y-3">
              {noteEntries.length ? (
                noteEntries.map((note) => (
                  <div key={note.noteId} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap wrap-break-words">{note.note}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      {note.createdByName ?? "Unknown staff"} - {formatDate(note.createdAt)}
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
