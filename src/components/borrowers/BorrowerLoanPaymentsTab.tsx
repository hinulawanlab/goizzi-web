// src/components/borrowers/BorrowerLoanPaymentsTab.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil } from "lucide-react";

import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";
import type { PaymentBreakdown, RepaymentScheduleEntry } from "@/shared/types/repaymentSchedule";

interface BorrowerLoanPaymentsTabProps {
  loanId: string;
  scheduleEntries: RepaymentScheduleEntry[];
}

interface PaymentDraft {
  amountPaid: string;
  principal: string;
  interest: string;
  financeCharge: string;
  lateCharge: string;
  other: string;
  remarks: string;
  dueDate: string;
}

const EMPTY_DRAFT: PaymentDraft = {
  amountPaid: "",
  principal: "",
  interest: "",
  financeCharge: "",
  lateCharge: "",
  other: "",
  remarks: "",
  dueDate: ""
};

interface RowState {
  state: ActionState;
  message: string;
  isEditing: boolean;
}

function formatAmountInput(value?: number) {
  if (typeof value !== "number") {
    return "";
  }
  return value.toString();
}

function parseAmountInput(value?: string): number | null {
  if (!value || !value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed);
}

function getBreakdownSum(draft: PaymentDraft): number | null {
  const values = [
    parseAmountInput(draft.principal),
    parseAmountInput(draft.interest),
    parseAmountInput(draft.financeCharge),
    parseAmountInput(draft.lateCharge),
    parseAmountInput(draft.other)
  ];
  if (values.some((value) => value === null)) {
    return null;
  }
  return (values as number[]).reduce((sum, value) => sum + value, 0);
}

function buildInitialDraft(entry: RepaymentScheduleEntry): PaymentDraft {
  const breakdown = entry.breakdown ?? {};
  return {
    amountPaid: formatAmountInput(entry.amountPaidAmount),
    principal: formatAmountInput(breakdown.principalAmount),
    interest: formatAmountInput(breakdown.interestAmount),
    financeCharge: formatAmountInput(breakdown.financeChargeAmount),
    lateCharge: formatAmountInput(breakdown.lateChargeAmount),
    other: formatAmountInput(breakdown.otherAmount),
    remarks: entry.remarks ?? "",
    dueDate: entry.dueDate ?? ""
  };
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

export default function BorrowerLoanPaymentsTab({ loanId, scheduleEntries }: BorrowerLoanPaymentsTabProps) {
  const [entries, setEntries] = useState<RepaymentScheduleEntry[]>(() => scheduleEntries);
  const [drafts, setDrafts] = useState<Record<string, PaymentDraft>>({});
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [customDraft, setCustomDraft] = useState<PaymentDraft>({
    ...EMPTY_DRAFT,
    dueDate: new Date().toISOString().split("T")[0]
  });
  const [customState, setCustomState] = useState<ActionState>("idle");
  const [customMessage, setCustomMessage] = useState("");
  const [isCustomOpen, setIsCustomOpen] = useState(true);

  useEffect(() => {
    setEntries(scheduleEntries);
    const nextDrafts: Record<string, PaymentDraft> = {};
    const nextStates: Record<string, RowState> = {};
    scheduleEntries.forEach((entry) => {
      nextDrafts[entry.scheduleId] = buildInitialDraft(entry);
      nextStates[entry.scheduleId] = {
        state: "idle",
        message: "",
        isEditing: false
      };
    });
    setDrafts(nextDrafts);
    setRowStates((prev) => ({ ...nextStates, ...prev }));
  }, [scheduleEntries]);

  const updateDraft = useCallback((scheduleId: string, field: keyof PaymentDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [scheduleId]: {
        ...prev[scheduleId],
        [field]: value
      }
    }));
  }, []);

  const updateCustomDraft = useCallback((field: keyof PaymentDraft, value: string) => {
    setCustomDraft((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const setRowState = useCallback((scheduleId: string, updates: Partial<RowState>) => {
    setRowStates((prev) => {
      const current = prev[scheduleId] ?? { state: "idle", message: "", isEditing: false };
      return {
        ...prev,
        [scheduleId]: {
          ...current,
          ...updates
        }
      };
    });
  }, []);

  const updateEntry = useCallback((updated: RepaymentScheduleEntry) => {
    setEntries((prev) => prev.map((entry) => (entry.scheduleId === updated.scheduleId ? updated : entry)));
    setDrafts((prev) => ({
      ...prev,
      [updated.scheduleId]: buildInitialDraft(updated)
    }));
  }, []);

  const addCustomEntry = useCallback((entry: RepaymentScheduleEntry) => {
    setEntries((prev) => {
      const next = [...prev, entry];
      next.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (entry: RepaymentScheduleEntry, action: "apply" | "edit") => {
      const draft = drafts[entry.scheduleId];
      if (!draft) {
        return;
      }

      if (!draft.dueDate) {
        setRowState(entry.scheduleId, {
          state: "error",
          message: "Select a due date."
        });
        return;
      }

      const amountPaidAmount = parseAmountInput(draft.amountPaid);
      const breakdownSum = getBreakdownSum(draft);
      if (amountPaidAmount === null || breakdownSum === null) {
        setRowState(entry.scheduleId, {
          state: "error",
          message: "Enter payment and complete all breakdown fields."
        });
        return;
      }
      if (amountPaidAmount !== breakdownSum) {
        setRowState(entry.scheduleId, {
          state: "error",
          message: "Breakdown must equal amount paid."
        });
        return;
      }

      const breakdown: PaymentBreakdown = {
        principalAmount: parseAmountInput(draft.principal) ?? 0,
        interestAmount: parseAmountInput(draft.interest) ?? 0,
        financeChargeAmount: parseAmountInput(draft.financeCharge) ?? 0,
        lateChargeAmount: parseAmountInput(draft.lateCharge) ?? 0,
        otherAmount: parseAmountInput(draft.other) ?? 0
      };

      setRowState(entry.scheduleId, { state: "working", message: "Saving payment..." });
      try {
      const response = await fetch(`/api/loans/${loanId}/repayment-schedule/${entry.scheduleId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          dueDate: draft.dueDate,
          amountPaidAmount,
          breakdown,
          remarks: draft.remarks
        })
      });

        if (!response.ok) {
          const errorPayload = (await response.json()) as { error?: string };
          throw new Error(errorPayload.error ?? "Unable to post payment.");
        }

        const payload = (await response.json()) as { entry: RepaymentScheduleEntry };
        updateEntry(payload.entry);
        setRowState(entry.scheduleId, {
          state: "success",
          message: action === "edit" ? "Payment updated." : "Payment applied.",
          isEditing: false
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to post payment.";
        setRowState(entry.scheduleId, { state: "error", message });
      }
    },
    [drafts, loanId, setRowState, updateEntry]
  );

  const rows = useMemo(
    () =>
      [...entries].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((entry) => {
        const draft = drafts[entry.scheduleId] ?? buildInitialDraft(entry);
        const rowState = rowStates[entry.scheduleId] ?? { state: "idle", message: "", isEditing: false };
        const amountPaidAmount = parseAmountInput(draft.amountPaid);
        const breakdownSum = getBreakdownSum(draft);
        const isPaymentValid = amountPaidAmount !== null && breakdownSum !== null && amountPaidAmount === breakdownSum;
        const isPaid = entry.paymentStatus === "paid" || typeof entry.amountPaidAmount === "number";
        const isEditing = rowState.isEditing;
        const disableInputs = isPaid && !isEditing;
        const disableAction = rowState.state === "working" || !isPaymentValid;

        return {
          entry,
          draft,
          rowState,
          isPaid,
          isEditing,
          disableInputs,
          disableAction
        };
      }),
    [drafts, entries, rowStates]
  );

  const handleCustomSubmit = useCallback(async () => {
    const amountPaidAmount = parseAmountInput(customDraft.amountPaid);
    const breakdownSum = getBreakdownSum(customDraft);
    if (amountPaidAmount === null || breakdownSum === null) {
      setCustomState("error");
      setCustomMessage("Enter payment and complete all breakdown fields.");
      return;
    }
    if (amountPaidAmount !== breakdownSum) {
      setCustomState("error");
      setCustomMessage("Breakdown must equal amount paid.");
      return;
    }

    if (!customDraft.dueDate) {
      setCustomState("error");
      setCustomMessage("Select a payment date.");
      return;
    }

    const breakdown: PaymentBreakdown = {
      principalAmount: parseAmountInput(customDraft.principal) ?? 0,
      interestAmount: parseAmountInput(customDraft.interest) ?? 0,
      financeChargeAmount: parseAmountInput(customDraft.financeCharge) ?? 0,
      lateChargeAmount: parseAmountInput(customDraft.lateCharge) ?? 0,
      otherAmount: parseAmountInput(customDraft.other) ?? 0
    };

    setCustomState("working");
    setCustomMessage("Saving custom payment...");
    try {
      const response = await fetch(`/api/loans/${loanId}/repayment-schedule/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaidAmount,
          breakdown,
          remarks: customDraft.remarks,
          paidAt: customDraft.dueDate
        })
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? "Unable to post custom payment.");
      }

      const payload = (await response.json()) as { entry: RepaymentScheduleEntry };
      addCustomEntry(payload.entry);
      setCustomDraft({
        ...EMPTY_DRAFT,
        dueDate: new Date().toISOString().split("T")[0]
      });
      setIsCustomOpen(false);
      setCustomState("success");
      setCustomMessage("Custom payment posted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to post custom payment.";
      setCustomState("error");
      setCustomMessage(message);
    }
  }, [addCustomEntry, customDraft, loanId]);

  const customAmountPaidAmount = parseAmountInput(customDraft.amountPaid);
  const customBreakdownSum = getBreakdownSum(customDraft);
  const isCustomPaymentValid =
    customDraft.dueDate.trim().length > 0 &&
    customAmountPaidAmount !== null &&
    customBreakdownSum !== null &&
    customAmountPaidAmount === customBreakdownSum;

  if (!entries.length) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">No repayment schedule yet.</p>
        <p className="mt-2 text-xs text-slate-500">Create a schedule by proceeding with the loan.</p>
      </section>
    );
  }

  const listGridClass =
    "grid grid-cols-[minmax(140px,1fr)_minmax(140px,1fr)_minmax(120px,1fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(130px,1fr)_minmax(110px,1fr)_minmax(100px,1fr)_minmax(200px,1.4fr)_minmax(120px,0.9fr)] gap-3 items-start";
  const baseInputClass = "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none";
  const disabledInputClass = "border-slate-200 bg-slate-100 text-slate-400";

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsCustomOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 cursor-pointer"
        >
          {isCustomOpen ? "Close custom payment" : "Custom payment"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-md border border-slate-200 bg-white">
        <div className={`${listGridClass} border-b border-slate-200 px-4 py-2 text-xs font-medium text-slate-500`}>
          <span>Type</span>
          <span>Payment date</span>
          <span>Amount paid</span>
          <span>Principal</span>
          <span>Interest</span>
          <span>Finance charge</span>
          <span>Late charge</span>
          <span>Others</span>
          <span>Remarks</span>
          <span className="text-right">Action</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isCustomOpen && (
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className={listGridClass}>
                <div className="text-sm font-semibold text-slate-900">Custom payment</div>
                <div>
                  <label className="sr-only" htmlFor="custom-date">
                    Payment date
                  </label>
                  <input
                    id="custom-date"
                    type="date"
                    value={customDraft.dueDate}
                    onChange={(event) => updateCustomDraft("dueDate", event.target.value)}
                    disabled={customState === "working"}
                    className={baseInputClass}
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="custom-amount-paid">
                    Amount paid
                  </label>
                  <input
                    id="custom-amount-paid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={customDraft.amountPaid}
                    onChange={(event) => updateCustomDraft("amountPaid", event.target.value)}
                    disabled={customState === "working"}
                    className={baseInputClass}
                  />
                </div>

                {[
                  { key: "principal", label: "Principal" },
                  { key: "interest", label: "Interest" },
                  { key: "financeCharge", label: "Finance charge" },
                  { key: "lateCharge", label: "Late charge" },
                  { key: "other", label: "Others" }
                ].map((field) => (
                  <div key={`custom-${field.key}`}>
                    <label className="sr-only" htmlFor={`custom-${field.key}`}>
                      {field.label}
                    </label>
                    <input
                      id={`custom-${field.key}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={customDraft[field.key as keyof PaymentDraft]}
                      onChange={(event) => updateCustomDraft(field.key as keyof PaymentDraft, event.target.value)}
                      disabled={customState === "working"}
                      className={baseInputClass}
                    />
                  </div>
                ))}

                <div>
                  <label className="sr-only" htmlFor="custom-remarks">
                    Remarks
                  </label>
                  <textarea
                    id="custom-remarks"
                    value={customDraft.remarks}
                    onChange={(event) => updateCustomDraft("remarks", event.target.value)}
                    disabled={customState === "working"}
                    rows={2}
                    className={`${baseInputClass} resize-none`}
                  />
                </div>

                <div className="flex items-start justify-end">
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={customState === "working" || !isCustomPaymentValid}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium ${
                      customState === "working" || !isCustomPaymentValid
                        ? "cursor-not-allowed border-slate-200 text-slate-300"
                        : "cursor-pointer border-emerald-300 text-emerald-700 hover:border-emerald-400"
                    }`}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    Apply
                  </button>
                </div>
              </div>

              {customState === "working" && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                  {customMessage}
                </div>
              )}
              {customState === "success" && customMessage && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {customMessage}
                </div>
              )}
              {customState === "error" && customMessage && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {customMessage}
                </div>
              )}
            </div>
          )}

          {rows.map(({ entry, draft, rowState, isPaid, isEditing, disableInputs, disableAction }) => (
            <div key={entry.scheduleId} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
              <div className={listGridClass}>
                <div className="space-y-1">
                  {isPaid && (
                    <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Payment
                    </span>
                  )}
                  <p className="text-sm font-semibold text-slate-900">
                    {entry.scheduleType === "custom"
                      ? "Custom"
                      : `Installment ${entry.installmentNumber ?? "N/A"}`}
                  </p>
                </div>
                <div>
                  <label className="sr-only" htmlFor={`due-date-${entry.scheduleId}`}>
                    Payment date
                  </label>
                  <input
                    id={`due-date-${entry.scheduleId}`}
                    type="date"
                    value={draft.dueDate}
                    onChange={(event) => updateDraft(entry.scheduleId, "dueDate", event.target.value)}
                    disabled={disableInputs || rowState.state === "working"}
                    className={`${baseInputClass} ${disableInputs ? disabledInputClass : ""}`}
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`amount-paid-${entry.scheduleId}`}>
                    Amount paid
                  </label>
                  <input
                    id={`amount-paid-${entry.scheduleId}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.amountPaid}
                    onChange={(event) => updateDraft(entry.scheduleId, "amountPaid", event.target.value)}
                    disabled={disableInputs || rowState.state === "working"}
                    className={`${baseInputClass} ${disableInputs ? disabledInputClass : ""}`}
                  />
                </div>

                {[
                  { key: "principal", label: "Principal" },
                  { key: "interest", label: "Interest" },
                  { key: "financeCharge", label: "Finance charge" },
                  { key: "lateCharge", label: "Late charge" },
                  { key: "other", label: "Others" }
                ].map((field) => (
                  <div key={`${entry.scheduleId}-${field.key}`}>
                    <label className="sr-only" htmlFor={`${field.key}-${entry.scheduleId}`}>
                      {field.label}
                    </label>
                    <input
                      id={`${field.key}-${entry.scheduleId}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft[field.key as keyof PaymentDraft]}
                      onChange={(event) =>
                        updateDraft(entry.scheduleId, field.key as keyof PaymentDraft, event.target.value)
                      }
                      disabled={disableInputs || rowState.state === "working"}
                      className={`${baseInputClass} ${disableInputs ? disabledInputClass : ""}`}
                    />
                  </div>
                ))}

                <div>
                  <label className="sr-only" htmlFor={`remarks-${entry.scheduleId}`}>
                    Remarks
                  </label>
                  <textarea
                    id={`remarks-${entry.scheduleId}`}
                    value={draft.remarks}
                    onChange={(event) => updateDraft(entry.scheduleId, "remarks", event.target.value)}
                    disabled={disableInputs || rowState.state === "working"}
                    rows={2}
                    className={`${baseInputClass} ${disableInputs ? disabledInputClass : ""} resize-none`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {isPaid && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setRowState(entry.scheduleId, { isEditing: true, state: "idle", message: "" })}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        updateEntry(entry);
                        setRowState(entry.scheduleId, { isEditing: false, state: "idle", message: "" });
                      }}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  {(isEditing || !isPaid) && (
                    <button
                      type="button"
                      onClick={() => handleSubmit(entry, isPaid ? "edit" : "apply")}
                      disabled={disableAction}
                      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium ${
                        disableAction
                          ? "cursor-not-allowed border-slate-200 text-slate-300"
                          : "cursor-pointer border-emerald-300 text-emerald-700 hover:border-emerald-400"
                      }`}
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      {isPaid ? "Save" : "Apply"}
                    </button>
                  )}
                </div>
              </div>

              {rowState.state === "working" && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                  {rowState.message}
                </div>
              )}
              {rowState.state === "success" && rowState.message && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {rowState.message}
                </div>
              )}
              {rowState.state === "error" && rowState.message && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {rowState.message}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
