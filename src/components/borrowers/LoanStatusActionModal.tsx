"use client";

import { useState } from "react";

import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";

interface LoanStatusActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  reasonLabel?: string;
  actionState: ActionState;
  actionMessage: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function LoanStatusActionModal({
  isOpen,
  title,
  description,
  confirmLabel,
  reasonLabel = "Reason",
  actionState,
  actionMessage,
  onClose,
  onConfirm
}: LoanStatusActionModalProps) {
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState("");

  if (!isOpen) {
    return null;
  }

  const isWorking = actionState === "working";

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setLocalError("Add a reason before confirming.");
      return;
    }
    setLocalError("");
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={onClose}
        disabled={isWorking}
        className="absolute inset-0 cursor-default bg-slate-900/60"
        aria-label="Close confirmation modal"
      />
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{title}</p>
            <h3 className="text-xl font-semibold text-slate-900">{description}</h3>
            <p className="text-sm text-slate-500">
              Add a reason so the audit trail captures why this status changed.
            </p>
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
            <label className="text-[11px] uppercase tracking-[0.3em] text-slate-400" htmlFor="loan-status-reason">
              {reasonLabel}
            </label>
            <textarea
              id="loan-status-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={isWorking}
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
              placeholder="Add a short reason for this status change."
            />
          </div>

          {localError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {localError}
            </div>
          )}

          {actionState === "working" && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
              {actionMessage}
            </div>
          )}

          {actionState === "error" && actionMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionMessage}
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
              onClick={handleConfirm}
              disabled={isWorking}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                isWorking
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "cursor-pointer border-slate-900 bg-slate-900 text-white hover:border-slate-700 hover:bg-slate-800"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
