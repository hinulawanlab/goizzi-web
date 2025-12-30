// src/components/borrowers/BorrowerKycDecisionSection.tsx
"use client";

import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";

export type DecisionAction = "approve" | "reject" | "waive" | "unwaive";

interface BorrowerKycDecisionSectionProps {
  actionState: ActionState;
  actionMessage?: string;
  onDecision: (action: DecisionAction) => void;
  isWaived: boolean;
}

export default function BorrowerKycDecisionSection({
  actionState,
  actionMessage,
  onDecision,
  isWaived
}: BorrowerKycDecisionSectionProps) {
  const isWorking = actionState === "working";
  const waiveAction: DecisionAction = isWaived ? "unwaive" : "waive";
  const waiveLabel = isWaived ? "Unwaive requirement" : "Waive requirement";

  return (
    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Decision</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onDecision("approve")}
          disabled={isWorking}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
            isWorking
              ? "cursor-not-allowed border-emerald-200 text-emerald-300"
              : "cursor-pointer border-emerald-400 text-emerald-600 hover:border-emerald-500 hover:text-emerald-700"
          }`}
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onDecision("reject")}
          disabled={isWorking}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
            isWorking
              ? "cursor-not-allowed border-rose-200 text-rose-300"
              : "cursor-pointer border-rose-400 text-rose-600 hover:border-rose-500 hover:text-rose-700"
          }`}
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => onDecision(waiveAction)}
          disabled={isWorking}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
            isWorking
              ? "cursor-not-allowed border-slate-200 text-slate-300"
              : "cursor-pointer border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800"
          }`}
        >
          {waiveLabel}
        </button>
      </div>
      {actionState === "working" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
          {actionMessage ?? "Updating approval..."}
        </div>
      )}
      {actionState === "success" && actionMessage && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      )}
      {actionState === "error" && actionMessage && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionMessage}
        </div>
      )}
    </div>
  );
}
