// src/components/borrowers/BorrowerApplicationApprovalModal.tsx
"use client";

import { useState } from "react";

import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";

interface ApprovalPayload {
  loanAmount: number;
  loanInterest: number;
  termMonths: number;
  approvedAt: string;
}

interface BorrowerApplicationApprovalModalProps {
  isOpen: boolean;
  defaultAmount?: string;
  defaultTerm?: string;
  defaultInterest?: number;
  defaultApprovedAt: string;
  isChecklistComplete: boolean;
  statusActionState: ActionState;
  statusActionMessage: string;
  onClose: () => void;
  onSubmit: (payload: ApprovalPayload) => Promise<boolean>;
}

function toNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function BorrowerApplicationApprovalModal({
  isOpen,
  defaultAmount,
  defaultTerm,
  defaultInterest = 1.5,
  defaultApprovedAt,
  isChecklistComplete,
  statusActionState,
  statusActionMessage,
  onClose,
  onSubmit
}: BorrowerApplicationApprovalModalProps) {
  const [loanAmount, setLoanAmount] = useState(defaultAmount ?? "");
  const [loanInterest, setLoanInterest] = useState(defaultInterest.toString());
  const [termMonths, setTermMonths] = useState(defaultTerm ?? "");
  const [approvedAt, setApprovedAt] = useState(defaultApprovedAt);
  const [localError, setLocalError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    setLocalError("");

    if (!isChecklistComplete) {
      setLocalError("Complete the checklist before proceeding.");
      return;
    }

    const amountValue = toNumber(loanAmount);
    const interestValue = toNumber(loanInterest);
    const termValue = toNumber(termMonths);

    if (!amountValue || amountValue <= 0) {
      setLocalError("Loan amount must be greater than 0.");
      return;
    }
    if (interestValue === null || interestValue < 0) {
      setLocalError("Interest rate must be 0 or higher.");
      return;
    }
    if (!termValue || termValue <= 0) {
      setLocalError("Term (months) must be greater than 0.");
      return;
    }
    if (!approvedAt) {
      setLocalError("Approval date is required.");
      return;
    }

    const success = await onSubmit({
      loanAmount: amountValue,
      loanInterest: interestValue,
      termMonths: termValue,
      approvedAt
    });

    if (success) {
      onClose();
      if (typeof window !== "undefined") {
        const openerWindow = window.opener;
        if (openerWindow && !openerWindow.closed) {
          try {
            openerWindow.postMessage(
              { type: "borrower-profile-refresh" },
              window.location.origin
            );
          } catch {
            // Ignore refresh failures (cross-origin or blocked).
          }
        }
        window.close();
      }
    }
  };

  const isWorking = statusActionState === "working";
  const isProceedDisabled = isWorking || !isChecklistComplete;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/60"
        aria-label="Close approval modal"
        disabled={isWorking}
      />
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Approve loan</p>
            <h3 className="text-xl font-semibold text-slate-900">Finalize loan approval details</h3>
            <p className="text-sm text-slate-500">Confirm the loan setup before approving.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              isWorking
                ? "cursor-not-allowed border-slate-200 text-slate-300"
                : "cursor-pointer border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-amount">
              Loan amount (PHP)
            </label>
            <input
              id="loan-amount"
              type="number"
              min="0"
              step="1"
              value={loanAmount}
              onChange={(event) => setLoanAmount(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-interest">
              Interest rate (% per month)
            </label>
            <input
              id="loan-interest"
              type="number"
              min="0"
              step="0.1"
              value={loanInterest}
              onChange={(event) => setLoanInterest(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-term">
              Term of loan (months)
            </label>
            <input
              id="loan-term"
              type="number"
              min="1"
              step="1"
              value={termMonths}
              onChange={(event) => setTermMonths(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="approval-date">
              Date of approval
            </label>
            <input
              id="approval-date"
              type="date"
              value={approvedAt}
              onChange={(event) => setApprovedAt(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          {localError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {localError}
            </div>
          )}

          {statusActionState === "working" && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
              {statusActionMessage}
            </div>
          )}

          {statusActionState === "error" && statusActionMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {statusActionMessage}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isWorking}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                isWorking
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "cursor-pointer border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProceedDisabled}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                isProceedDisabled
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "cursor-pointer border-slate-900 bg-slate-900 text-white hover:border-slate-700 hover:bg-slate-800"
              }`}
            >
              Proceed to approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
