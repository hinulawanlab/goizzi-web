// src/components/borrowers/BorrowerApplicationChecklistModal.tsx
"use client";

import { Check } from "lucide-react";

type ChecklistState = "idle" | "working" | "success" | "error";

interface ChecklistItem {
  key: string;
  label: string;
  checked: boolean;
  required?: boolean;
  readOnly?: boolean;
}

interface BorrowerApplicationChecklistModalProps {
  isOpen: boolean;
  autoItems: ChecklistItem[];
  manualItems: ChecklistItem[];
  checklistState: ChecklistState;
  checklistMessage: string;
  onToggleManualItem: (key: string, checked: boolean) => void;
}

export default function BorrowerApplicationChecklistModal({
  isOpen,
  autoItems,
  manualItems,
  checklistState,
  checklistMessage,
  onToggleManualItem
}: BorrowerApplicationChecklistModalProps) {
  if (!isOpen) {
    return null;
  }

  const isWorking = checklistState === "working";

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="pointer-events-auto absolute left-1/2 top-8 w-full max-w-sm -translate-x-[calc(100%+360px)] rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
        <div className="border-b border-slate-100 pb-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Approval checklist</p>
          <h3 className="text-lg font-semibold text-slate-900">Required confirmations</h3>
          <p className="text-xs text-slate-500">Auto-checks reflect approved or waived items.</p>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Auto checks</p>
            <div className="mt-2 space-y-1">
              {autoItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                      item.checked ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-slate-200 text-slate-300"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Manual checks</p>
            <div className="mt-2 space-y-1">
              {manualItems.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-2"
                >
                  <span className="text-sm text-slate-700">
                    {item.label}
                    {!item.required && <span className="ml-2 text-xs uppercase tracking-[0.2em] text-slate-300">Optional</span>}
                  </span>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    disabled={isWorking}
                    onChange={(event) => onToggleManualItem(item.key, event.target.checked)}
                    className="h-4 w-4 accent-slate-900"
                  />
                </label>
              ))}
            </div>
          </div>

          {checklistState === "working" && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-transparent" />
              {checklistMessage || "Saving checklist..."}
            </div>
          )}

          {checklistState === "error" && checklistMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {checklistMessage}
            </div>
          )}

          {checklistState === "success" && checklistMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-600">
              {checklistMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
