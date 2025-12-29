// src/components/borrowers/BorrowerLoanTabSection.tsx
"use client";

import { useMemo, useState } from "react";

import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LoanSummary } from "@/shared/types/loan";
import type { BorrowerLoanTabKey } from "@/components/borrowers/borrowerLoanTypes";
import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";

interface BorrowerLoanTabSectionProps {
  activeTab: BorrowerLoanTabKey;
  borrower: BorrowerSummary;
  loan: LoanSummary;
}

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

function formatAmount(value?: number, currency?: string) {
  if (typeof value !== "number") {
    return "N/A";
  }
  const normalized = value / 100;
  const formatted = normalized.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return currency ? `${currency} ${formatted}` : formatted;
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm text-slate-600 last:border-b-0">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900">{value || "N/A"}</span>
    </div>
  );
}

function formatEditableAmount(value?: number) {
  if (typeof value !== "number") {
    return "";
  }
  return (value / 100).toFixed(2);
}

function formatInputDate(value?: string) {
  if (!value || value === "N/A") {
    return "";
  }
  return value;
}

function addMonths(value: string, months: number) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "N/A";
  }
  const date = new Date(parsed);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}

export default function BorrowerLoanTabSection({ activeTab, borrower, loan }: BorrowerLoanTabSectionProps) {
  const [principalInput, setPrincipalInput] = useState(() => formatEditableAmount(loan.principalAmount));
  const [termMonthsInput, setTermMonthsInput] = useState(
    loan.termMonths ? loan.termMonths.toString() : ""
  );
  const [startDateInput, setStartDateInput] = useState(() => formatInputDate(loan.startDate));
  const [isEditable, setIsEditable] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState("");

  const maturityDate = useMemo(() => {
    const termValue = Number(termMonthsInput);
    if (!startDateInput || !Number.isFinite(termValue) || termValue <= 0) {
      return "N/A";
    }
    return addMonths(startDateInput, termValue);
  }, [startDateInput, termMonthsInput]);

  const handleCancelEdit = () => {
    setPrincipalInput(formatEditableAmount(loan.principalAmount));
    setTermMonthsInput(loan.termMonths ? loan.termMonths.toString() : "");
    setStartDateInput(formatInputDate(loan.startDate));
    setIsEditable(false);
    setActionState("idle");
    setActionMessage("");
  };

  const patchLoan = async (
    payload: Record<string, unknown>,
    workingMessage: string,
    successMessage: string,
    onSuccess?: () => void
  ) => {
    setActionState("working");
    setActionMessage(workingMessage);
    try {
      const response = await fetch(`/api/loans/${loan.loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? "Unable to update loan.");
      }

      setActionState("success");
      setActionMessage(successMessage);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update loan.";
      setActionState("error");
      setActionMessage(message);
    }
  };

  const resolvePrincipalAmount = () => {
    const parsed = Number(principalInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }
    return Math.round(parsed * 100);
  };

  const resolveTermMonths = () => {
    const parsed = Number(termMonthsInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return Math.round(parsed);
  };

  const resolveStartDate = () => (startDateInput ? startDateInput : null);

  const isWorking = actionState === "working";

  if (activeTab === "payments") {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Payments view is being prepared.</p>
        <p className="mt-2 text-xs text-slate-500">Loan payments will appear here once the module is connected.</p>
      </section>
    );
  }

  if (activeTab === "statement") {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Statement of account is coming soon.</p>
        <p className="mt-2 text-xs text-slate-500">We will surface an audit-ready statement for each loan.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loan snapshot</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-slate-900">Loan details</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {isLocked ? "Locked after proceed" : isEditable ? "Editable" : "Read-only"}
        </span>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <DetailRow label="Borrower" value={borrower.fullName} />
          <DetailRow label="Borrower ID" value={borrower.borrowerId} />
          <DetailRow label="Loan ID" value={loan.loanId} />
          <DetailRow label="Status" value={loan.status} />
          <DetailRow label="Product" value={loan.productName ?? loan.productId} />
          <DetailRow label="Outstanding" value={formatAmount(loan.totalOutstandingAmount, loan.currency)} />
          <DetailRow label="Next due" value={formatDate(loan.nextDueDate)} />
          <DetailRow label="Last payment" value={formatDate(loan.lastPaymentAt)} />
          <DetailRow label="Last updated" value={formatDate(loan.updatedAt)} />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-principal">
                Principal ({loan.currency ?? "PHP"})
              </label>
              <input
                id="loan-principal"
                type="number"
                min="0"
                step="0.01"
                value={principalInput}
                onChange={(event) => setPrincipalInput(event.target.value)}
                disabled={!isEditable || isLocked || isWorking}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm shadow-sm focus:outline-none ${
                  !isEditable || isLocked
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 focus:border-slate-400"
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-term">
                Term (months)
              </label>
              <input
                id="loan-term"
                type="number"
                min="1"
                step="1"
                value={termMonthsInput}
                onChange={(event) => setTermMonthsInput(event.target.value)}
                disabled={!isEditable || isLocked || isWorking}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm shadow-sm focus:outline-none ${
                  !isEditable || isLocked
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 focus:border-slate-400"
                }`}
                placeholder="Enter term in months"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-start-date">
                Loan date cycle
              </label>
              <input
                id="loan-start-date"
                type="date"
                value={startDateInput}
                onChange={(event) => setStartDateInput(event.target.value)}
                disabled={!isEditable || isLocked || isWorking}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm shadow-sm focus:outline-none ${
                  !isEditable || isLocked
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 focus:border-slate-400"
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-maturity-date">
                Maturity date
              </label>
              <input
                id="loan-maturity-date"
                type="text"
                value={maturityDate === "N/A" ? "" : maturityDate}
                placeholder={maturityDate}
                readOnly
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void patchLoan(
              {
                action: "cancel",
                borrowerId: borrower.borrowerId,
                applicationId: loan.applicationId
              },
              "Canceling loan...",
              "Loan cancelled.",
              () => {
                setIsEditable(false);
                setIsLocked(true);
              }
            );
          }}
          disabled={isWorking}
          className={`cursor-pointer rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
            isWorking
              ? "cursor-not-allowed border-slate-200 text-slate-300"
              : "border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700"
          }`}
        >
          Cancel loan
        </button>
        {!isEditable && (
          <>
            <button
              type="button"
              onClick={() => {
                if (!isLocked) {
                  setIsEditable(true);
                  setActionState("idle");
                  setActionMessage("");
                }
              }}
              disabled={isLocked || isWorking}
              className={`cursor-pointer rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                isLocked || isWorking
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-900 text-slate-900 hover:border-slate-700 hover:text-slate-700"
              }`}
            >
              Edit loan
            </button>
            <button
              type="button"
              onClick={() => {
                const resolvedPrincipal = resolvePrincipalAmount();
                const resolvedTermMonths = resolveTermMonths();
                const resolvedStartDate = resolveStartDate();

                if (!resolvedPrincipal || !resolvedTermMonths || !resolvedStartDate) {
                  setActionState("error");
                  setActionMessage("Fill out principal, term, and loan date cycle.");
                  return;
                }

                void patchLoan(
                  {
                    action: "proceed",
                    principalAmount: resolvedPrincipal,
                    termMonths: resolvedTermMonths,
                    startDate: resolvedStartDate
                  },
                  "Proceeding with loan...",
                  "Loan marked as active.",
                  () => {
                    setIsEditable(false);
                    setIsLocked(true);
                  }
                );
              }}
              disabled={isLocked || isWorking}
              className={`cursor-pointer rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                isLocked || isWorking
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-900 bg-slate-900 text-white hover:border-slate-700 hover:bg-slate-800"
              }`}
            >
              Proceed with loan
            </button>
          </>
        )}
        {isEditable && (
          <>
            <button
              type="button"
              onClick={() => {
                const resolvedPrincipal = resolvePrincipalAmount();
                const resolvedTermMonths = resolveTermMonths();
                const resolvedStartDate = resolveStartDate();

                if (!resolvedPrincipal || !resolvedTermMonths || !resolvedStartDate) {
                  setActionState("error");
                  setActionMessage("Fill out principal, term, and loan date cycle.");
                  return;
                }

                void patchLoan(
                  {
                    action: "update",
                    principalAmount: resolvedPrincipal,
                    termMonths: resolvedTermMonths,
                    startDate: resolvedStartDate
                  },
                  "Updating loan details...",
                  "Loan details updated.",
                  () => setIsEditable(false)
                );
              }}
              disabled={isWorking}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                isWorking
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-900 bg-slate-900 text-white hover:border-slate-700 hover:bg-slate-800"
              }`}
            >
              Update loan details
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isWorking}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                isWorking
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {actionState === "working" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
          {actionMessage}
        </div>
      )}
      {actionState === "success" && actionMessage && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      )}
      {actionState === "error" && actionMessage && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionMessage}
        </div>
      )}
    </section>
  );
}
