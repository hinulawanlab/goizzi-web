// src/components/borrowers/BorrowerLoanTabSection.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LoanSummary } from "@/shared/types/loan";
import type { BorrowerLoanTabKey } from "@/components/borrowers/borrowerLoanTypes";
import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";
import BorrowerLoanPaymentsTab from "@/components/borrowers/BorrowerLoanPaymentsTab";
import type { RepaymentScheduleEntry } from "@/shared/types/repaymentSchedule";
import {
  buildRepaymentSchedule,
  resolveMaturityDate,
  resolveNextDueDate
} from "@/shared/utils/repaymentSchedule";

interface BorrowerLoanTabSectionProps {
  activeTab: BorrowerLoanTabKey;
  borrower: BorrowerSummary;
  loan: LoanSummary;
  repaymentSchedule: RepaymentScheduleEntry[];
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

function formatPaymentAmount(value?: number) {
  if (typeof value !== "number") {
    return "N/A";
  }
  return `PHP ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatRate(value?: number) {
  if (typeof value !== "number") {
    return "N/A";
  }
  return `${(value * 100).toFixed(2)}%`;
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

function formatEditableRate(value?: number) {
  if (typeof value !== "number") {
    return "";
  }
  return (value * 100).toFixed(2);
}

function formatInputDate(value?: string) {
  if (!value || value === "N/A") {
    return "";
  }
  return value;
}

function formatMaturityDate(value: string | null) {
  if (!value) {
    return "N/A";
  }
  return value;
}

const EDITABLE_STATUSES = new Set(["approved", "draft"]);

function isLoanEditable(status: string) {
  return EDITABLE_STATUSES.has(status);
}

export default function BorrowerLoanTabSection({
  activeTab,
  borrower,
  loan,
  repaymentSchedule
}: BorrowerLoanTabSectionProps) {
  const router = useRouter();
  const [principalInput, setPrincipalInput] = useState(() => formatEditableAmount(loan.principalAmount));
  const [termMonthsInput, setTermMonthsInput] = useState(
    loan.termMonths ? loan.termMonths.toString() : ""
  );
  const [paymentFrequencyInput, setPaymentFrequencyInput] = useState(
    loan.paymentFrequency ? loan.paymentFrequency.toString() : ""
  );
  const [interestRateInput, setInterestRateInput] = useState(() => formatEditableRate(loan.interestRate));
  const [startDateInput, setStartDateInput] = useState(() => formatInputDate(loan.startDate));
  const [isEditable, setIsEditable] = useState(false);
  const [isLocked, setIsLocked] = useState(() => !isLoanEditable(loan.status));
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const nextLocked = !isLoanEditable(loan.status);
    setIsLocked(nextLocked);
    if (nextLocked) {
      setIsEditable(false);
    }
  }, [loan.status]);

  useEffect(() => {
    if (!isEditable) {
      setPrincipalInput(formatEditableAmount(loan.principalAmount));
      setTermMonthsInput(loan.termMonths ? loan.termMonths.toString() : "");
      setPaymentFrequencyInput(loan.paymentFrequency ? loan.paymentFrequency.toString() : "");
      setInterestRateInput(formatEditableRate(loan.interestRate));
      setStartDateInput(formatInputDate(loan.startDate));
    }
  }, [
    isEditable,
    loan.principalAmount,
    loan.termMonths,
    loan.paymentFrequency,
    loan.interestRate,
    loan.startDate
  ]);

  const maturityDate = useMemo(() => {
    const termValue = Number(termMonthsInput);
    const paymentFrequencyValue = Number(paymentFrequencyInput);
    if (!startDateInput || !Number.isFinite(termValue) || termValue <= 0) {
      return "N/A";
    }
    if (Number.isFinite(paymentFrequencyValue) && paymentFrequencyValue > 0) {
      return formatMaturityDate(resolveMaturityDate(startDateInput, termValue));
    }
    return formatMaturityDate(resolveMaturityDate(startDateInput, termValue));
  }, [paymentFrequencyInput, startDateInput, termMonthsInput]);

  const nextDueDate = useMemo(() => {
    if (loan.nextDueDate) {
      return loan.nextDueDate;
    }
    const startDateValue = startDateInput || loan.startDate;
    const termValue = Number(termMonthsInput);
    const paymentFrequencyValue = Number(paymentFrequencyInput);
    if (
      !startDateValue ||
      !Number.isFinite(termValue) ||
      termValue <= 0 ||
      !Number.isFinite(paymentFrequencyValue) ||
      paymentFrequencyValue <= 0
    ) {
      return "N/A";
    }
    const schedule = buildRepaymentSchedule(startDateValue, termValue, paymentFrequencyValue);
    return resolveNextDueDate(schedule) ?? "N/A";
  }, [loan.nextDueDate, paymentFrequencyInput, startDateInput, termMonthsInput, loan.startDate]);

  const paymentsTimeline = useMemo(() => {
    return repaymentSchedule
      .filter((entry) => typeof entry.amountPaidAmount === "number")
      .map((entry) => ({
        scheduleId: entry.scheduleId,
        paidAt: entry.paidAt ?? entry.dueDate,
        amountPaidAmount: entry.amountPaidAmount,
        remarks: entry.remarks,
        breakdown: entry.breakdown ?? {}
      }))
      .sort((a, b) => {
        if (!a.paidAt && !b.paidAt) {
          return 0;
        }
        if (!a.paidAt) {
          return 1;
        }
        if (!b.paidAt) {
          return -1;
        }
        return a.paidAt.localeCompare(b.paidAt);
      });
  }, [repaymentSchedule]);

  const handleCancelEdit = () => {
    setPrincipalInput(formatEditableAmount(loan.principalAmount));
    setTermMonthsInput(loan.termMonths ? loan.termMonths.toString() : "");
    setPaymentFrequencyInput(loan.paymentFrequency ? loan.paymentFrequency.toString() : "");
    setInterestRateInput(formatEditableRate(loan.interestRate));
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
      router.refresh();
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

  const resolvePaymentFrequency = () => {
    const parsed = Number(paymentFrequencyInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return Math.round(parsed);
  };

  const resolveInterestRate = () => {
    const parsed = Number(interestRateInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }
    return parsed / 100;
  };

  const resolveStartDate = () => (startDateInput ? startDateInput : null);

  const isWorking = actionState === "working";

  if (activeTab === "payments") {
    return <BorrowerLoanPaymentsTab loanId={loan.loanId} scheduleEntries={repaymentSchedule} />;
  }

  if (activeTab === "statement") {
    return (
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Statement of account</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Payments timeline</h3>
        <p className="mt-1 text-sm text-slate-500">Chronological list of all payments made.</p>

        {!paymentsTimeline.length ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-900">No payments yet.</p>
            <p className="mt-2 text-xs text-slate-500">Payments will appear here once posted.</p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-600px text-left text-sm text-slate-600">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Amount paid</th>
                  <th className="px-3 py-3">Principal</th>
                  <th className="px-3 py-3">Interest</th>
                  <th className="px-3 py-3">Finance charge</th>
                  <th className="px-3 py-3">Late charge</th>
                  <th className="px-3 py-3">Others</th>
                  <th className="px-3 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentsTimeline.map((payment) => (
                  <tr key={payment.scheduleId} className="bg-white">
                    <td className="px-3 py-4 font-semibold text-slate-900">{formatDate(payment.paidAt)}</td>
                    <td className="px-3 py-4">{formatPaymentAmount(payment.amountPaidAmount)}</td>
                    <td className="px-3 py-4">
                      {formatPaymentAmount(payment.breakdown.principalAmount)}
                    </td>
                    <td className="px-3 py-4">
                      {formatPaymentAmount(payment.breakdown.interestAmount)}
                    </td>
                    <td className="px-3 py-4">
                      {formatPaymentAmount(payment.breakdown.financeChargeAmount)}
                    </td>
                    <td className="px-3 py-4">
                      {formatPaymentAmount(payment.breakdown.lateChargeAmount)}
                    </td>
                    <td className="px-3 py-4">
                      {formatPaymentAmount(payment.breakdown.otherAmount)}
                    </td>
                    <td className="px-3 py-4 text-slate-500">{payment.remarks || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-3 pl-6 shadow-md">
      {/* <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loan snapshot</p> */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-slate-900">Loan details</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {isLocked ? "Locked after proceed" : isEditable ? "Editable" : "Read-only"}
        </span>
      </div>

      <div className="mt-2 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <DetailRow label="Borrower" value={borrower.fullName} />
          <DetailRow label="Borrower ID" value={borrower.borrowerId} />
          <DetailRow label="Loan ID" value={loan.loanId} />
          <DetailRow label="Status" value={loan.status} />
          <DetailRow label="Product" value={loan.productName ?? loan.productId} />
          <DetailRow label="Interest rate" value={formatRate(loan.interestRate)} />
          <DetailRow label="Outstanding" value={formatAmount(loan.totalOutstandingAmount, loan.currency)} />
          <DetailRow label="Next due" value={formatDate(nextDueDate)} />
          <DetailRow label="Maturity date" value={formatDate(loan.maturityDate ?? maturityDate)} />
          <DetailRow label="Last payment" value={formatDate(loan.lastPaymentAt)} />
          <DetailRow label="Last updated" value={formatDate(loan.updatedAt)} />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="space-y-1">
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
              <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-interest-rate">
                Interest rate (%)
              </label>
              <input
                id="loan-interest-rate"
                type="number"
                min="0"
                step="0.01"
                value={interestRateInput}
                onChange={(event) => setInterestRateInput(event.target.value)}
                disabled={!isEditable || isLocked || isWorking}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm shadow-sm focus:outline-none ${
                  !isEditable || isLocked
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 focus:border-slate-400"
                }`}
                placeholder="Enter interest rate"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-frequency">
                Payments per month
              </label>
              <select
                id="loan-frequency"
                value={paymentFrequencyInput}
                onChange={(event) => setPaymentFrequencyInput(event.target.value)}
                disabled={!isEditable || isLocked || isWorking}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm shadow-sm focus:outline-none ${
                  !isEditable || isLocked
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 focus:border-slate-400"
                }`}
              >
                <option value="">Select payment frequency</option>
                <option value="1">Once a month</option>
                <option value="2">Bi-monthly</option>
                <option value="4">Weekly</option>
              </select>
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

      {!isLocked && (
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
                  const resolvedInterestRate = resolveInterestRate();
                  const resolvedPaymentFrequency = resolvePaymentFrequency();
                  const resolvedStartDate = resolveStartDate();

                  if (
                    !resolvedPrincipal ||
                    !resolvedTermMonths ||
                    resolvedInterestRate === null ||
                    !resolvedPaymentFrequency ||
                    !resolvedStartDate
                  ) {
                    setActionState("error");
                    setActionMessage("Fill out principal, term, interest rate, payment frequency, and loan date cycle.");
                    return;
                  }

                  void patchLoan(
                    {
                      action: "proceed",
                      principalAmount: resolvedPrincipal,
                      termMonths: resolvedTermMonths,
                      interestRate: resolvedInterestRate,
                      paymentFrequency: resolvedPaymentFrequency,
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
                  const resolvedInterestRate = resolveInterestRate();
                  const resolvedPaymentFrequency = resolvePaymentFrequency();
                  const resolvedStartDate = resolveStartDate();

                  if (
                    !resolvedPrincipal ||
                    !resolvedTermMonths ||
                    resolvedInterestRate === null ||
                    !resolvedPaymentFrequency ||
                    !resolvedStartDate
                  ) {
                    setActionState("error");
                    setActionMessage("Fill out principal, term, interest rate, payment frequency, and loan date cycle.");
                    return;
                  }

                  void patchLoan(
                    {
                      action: "update",
                      principalAmount: resolvedPrincipal,
                      termMonths: resolvedTermMonths,
                      interestRate: resolvedInterestRate,
                      paymentFrequency: resolvedPaymentFrequency,
                      startDate: resolvedStartDate
                    },
                    "Updating loan details...",
                    "Loan details updated.",
                    () => setIsEditable(false)
                  );
                }}
                disabled={isWorking}
                className={`cursor-pointer rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
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
                className={`cursor-pointer rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
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
      )}

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
