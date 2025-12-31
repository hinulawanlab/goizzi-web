// src/components/borrowers/BorrowerApplicationTabSection.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MessageSquare, MessageSquareOff, Phone, PhoneOff, X } from "lucide-react";

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
type AuditActionState = "idle" | "working" | "success" | "error";

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
  onKycDecisionRefresh?: () => void;
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

function formatNoteTypeLabel(noteType?: string) {
  if (noteType === "borrower") {
    return "Borrower";
  }
  if (noteType === "applicationNotes") {
    return "Application";
  }
  return "Uncategorized";
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
  onDecisionNoteAdded,
  onKycDecisionRefresh
}: BorrowerApplicationTabSectionProps) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ReferenceContactStatus>>({});
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [auditTypeFilter, setAuditTypeFilter] = useState<
    "all" | "borrower" | "applicationNotes" | "uncategorized"
  >("all");
  const [auditNotes, setAuditNotes] = useState<BorrowerNote[]>(() => noteEntries ?? []);
  const [auditActionStates, setAuditActionStates] = useState<Record<string, { state: AuditActionState; message: string }>>(
    {}
  );

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

  useEffect(() => {
    setAuditNotes(noteEntries ?? []);
  }, [noteEntries]);

  const setAuditActionState = (noteId: string, state: AuditActionState, message = "") => {
    setAuditActionStates((prev) => ({
      ...prev,
      [noteId]: { state, message }
    }));
  };

  const updateNoteFlags = async (
    noteId: string,
    updates: { isActive?: boolean; callActive?: boolean; messageActive?: boolean },
    workingMessage: string,
    successMessage: string
  ) => {
    setAuditActionState(noteId, "working", workingMessage);
    try {
      const response = await fetch(`/api/borrowers/${borrower.borrowerId}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      const payload = (await response.json()) as { note?: BorrowerNote; error?: string };
      if (!response.ok || !payload.note) {
        throw new Error(payload.error ?? "Unable to update note.");
      }

      setAuditNotes((prev) => prev.map((note) => (note.noteId === noteId ? payload.note! : note)));
      setAuditActionState(noteId, "success", successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update note.";
      setAuditActionState(noteId, "error", message);
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
          onDecisionComplete={onKycDecisionRefresh}
        />
      )}

      {activeTab === "payslips" && (
        <BorrowerPayslipPanel
          key={`payslips-${refreshTokensByTab.payslips}`}
          borrowerId={borrower.borrowerId}
          applicationId={application.applicationId}
          kycs={payslipKycs}
          onDecisionNoteAdded={onDecisionNoteAdded}
          onDecisionComplete={onKycDecisionRefresh}
        />
      )}

      {activeTab === "propertyTitles" && (
        <BorrowerPropertyTitlePanel
          key={`propertyTitles-${refreshTokensByTab.propertyTitles}`}
          borrowerId={borrower.borrowerId}
          applicationId={application.applicationId}
          kycs={propertyTitleKycs}
          onDecisionNoteAdded={onDecisionNoteAdded}
          onDecisionComplete={onKycDecisionRefresh}
        />
      )}

      {activeTab === "otherDocuments" && (
        <BorrowerOtherDocumentPanel
          key={`otherDocuments-${refreshTokensByTab.otherDocuments}`}
          borrowerId={borrower.borrowerId}
          applicationId={application.applicationId}
          kycs={otherKycs}
          onDecisionNoteAdded={onDecisionNoteAdded}
          onDecisionComplete={onKycDecisionRefresh}
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
          onDecisionComplete={onKycDecisionRefresh}
        />
      )}

      {activeTab === "audit" && (
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Audit notes</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Application note history</h3>
              <p className="mt-1 text-sm text-slate-500">
                Review notes saved for this application, including author and type.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              <label htmlFor="application-note-filter">Filter</label>
              <select
                id="application-note-filter"
                value={auditTypeFilter}
                onChange={(event) =>
                  setAuditTypeFilter(
                    event.target.value as "all" | "borrower" | "applicationNotes" | "uncategorized"
                  )
                }
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="borrower">Borrower</option>
                <option value="applicationNotes">Application notes</option>
                <option value="uncategorized">Uncategorized</option>
              </select>
            </div>
          </div>

          {auditNotes.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-900">No notes yet.</p>
              <p className="mt-2 text-xs text-slate-500">Notes created from the sidebar will appear here.</p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-900px text-left text-sm text-slate-600">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Author</th>
                    <th className="px-3 py-3">Created</th>
                    <th className="px-3 py-3">Seen</th>
                    <th className="px-3 py-3">Note</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditNotes
                    .filter((note) => {
                      if (auditTypeFilter === "all") {
                        return true;
                      }
                      if (auditTypeFilter === "uncategorized") {
                        return !note.type;
                      }
                      return note.type === auditTypeFilter;
                    })
                    .map((note) => {
                      const actionState = auditActionStates[note.noteId]?.state ?? "idle";
                      const actionMessage = auditActionStates[note.noteId]?.message ?? "";
                      const isBorrowerNote = note.type === "borrower";
                      const isWorking = actionState === "working";
                      return (
                        <tr key={note.noteId} className="bg-white">
                          <td className="px-3 py-4 font-semibold text-slate-900">
                            {formatNoteTypeLabel(note.type)}
                          </td>
                          <td className="px-3 py-4">{note.createdByName || "Unknown staff"}</td>
                          <td className="px-3 py-4">{formatDateTime(note.createdAt)}</td>
                          <td className="px-3 py-4">{note.isSeen ? "Yes" : "Not yet"}</td>
                          <td className="px-3 py-4 text-slate-500">{note.note}</td>
                          <td className="px-3 py-4">
                            {isBorrowerNote ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() =>
                                      void updateNoteFlags(
                                        note.noteId,
                                        { isActive: !note.isActive },
                                        "Updating active state...",
                                        "Active state updated."
                                      )
                                    }
                                    aria-label={note.isActive ? "Set inactive" : "Set active"}
                                    title={note.isActive ? "Click to deactivate" : "Click to activate"}
                                    className={`rounded-full border p-2 transition ${
                                      isWorking
                                        ? "cursor-not-allowed border-slate-200 text-slate-300"
                                        : note.isActive
                                          ? "cursor-pointer border-emerald-200 text-emerald-700 hover:border-emerald-300"
                                          : "cursor-pointer border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                    }`}
                                  >
                                    {note.isActive ? (
                                      <Check className="h-4 w-4" aria-hidden />
                                    ) : (
                                      <X className="h-4 w-4" aria-hidden />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() =>
                                      void updateNoteFlags(
                                        note.noteId,
                                        { callActive: !note.callActive },
                                        "Updating call state...",
                                        "Call state updated."
                                      )
                                    }
                                    aria-label={note.callActive ? "Disable call" : "Enable call"}
                                    title={note.callActive ? "Click to disable call" : "Click to enable call"}
                                    className={`rounded-full border p-2 transition ${
                                      isWorking
                                        ? "cursor-not-allowed border-slate-200 text-slate-300"
                                        : note.callActive
                                          ? "cursor-pointer border-blue-200 text-blue-700 hover:border-blue-300"
                                          : "cursor-pointer border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                    }`}
                                  >
                                    {note.callActive ? (
                                      <Phone className="h-4 w-4" aria-hidden />
                                    ) : (
                                      <PhoneOff className="h-4 w-4" aria-hidden />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() =>
                                      void updateNoteFlags(
                                        note.noteId,
                                        { messageActive: !note.messageActive },
                                        "Updating message state...",
                                        "Message state updated."
                                      )
                                    }
                                    aria-label={note.messageActive ? "Disable message" : "Enable message"}
                                    title={note.messageActive ? "Click to disable message" : "Click to enable message"}
                                    className={`rounded-full border p-2 transition ${
                                      isWorking
                                        ? "cursor-not-allowed border-slate-200 text-slate-300"
                                        : note.messageActive
                                          ? "cursor-pointer border-purple-200 text-purple-700 hover:border-purple-300"
                                          : "cursor-pointer border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                    }`}
                                  >
                                    {note.messageActive ? (
                                      <MessageSquare className="h-4 w-4" aria-hidden />
                                    ) : (
                                      <MessageSquareOff className="h-4 w-4" aria-hidden />
                                    )}
                                  </button>
                                </div>
                                {actionState === "working" && (
                                  <div className="text-xs text-slate-500">{actionMessage}</div>
                                )}
                                {actionState === "success" && actionMessage && (
                                  <div className="text-xs text-emerald-700">{actionMessage}</div>
                                )}
                                {actionState === "error" && actionMessage && (
                                  <div className="text-xs text-rose-700">{actionMessage}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">No actions</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
