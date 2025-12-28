"use client";

import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";
import { borrowerLoanActions } from "@/components/borrowers/borrowerLoanTypes";

interface BorrowerLoanNotesActionsProps {
  noteText: string;
  noteActionState: ActionState;
  noteActionMessage: string;
  actionState: ActionState;
  actionMessage: string;
  onNoteTextChange: (value: string) => void;
  onAddNote: () => void;
  onAction: (action: (typeof borrowerLoanActions)[number]) => void;
}

export default function BorrowerLoanNotesActions({
  noteText,
  noteActionState,
  noteActionMessage,
  actionState,
  actionMessage,
  onNoteTextChange,
  onAddNote,
  onAction
}: BorrowerLoanNotesActionsProps) {
  return (
    <div className="flex h-full flex-col rounded-3xl bg-linear-to-b from-slate-950/90 to-slate-900/60 p-6 shadow-glow ring-1 ring-white/20 backdrop-blur-lg">
      <p className="font-semibold text-md uppercase tracking-[0.3em] text-white">Notes & actions</p>
      <div className="mt-4 flex flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col">
          <label className="text-[11px] uppercase tracking-[0.3em] text-white/90" htmlFor="loan-note">
            Add a note
          </label>
          <textarea
            id="loan-note"
            value={noteText}
            onChange={(event) => onNoteTextChange(event.target.value)}
            rows={6}
            className="mt-2 w-full flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            placeholder="Write a note for this loan."
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onAddNote}
              disabled={noteActionState === "working" || !noteText.trim()}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                noteActionState === "working" || !noteText.trim()
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "cursor-pointer border-slate-900 bg-slate-900 text-white hover:border-slate-700 hover:bg-slate-800"
              }`}
            >
              Add note
            </button>
          </div>
          {noteActionState === "working" && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
              {noteActionMessage}
            </div>
          )}
          {noteActionState === "success" && noteActionMessage && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {noteActionMessage}
            </div>
          )}
          {noteActionState === "error" && noteActionMessage && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {noteActionMessage}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-black/90">Available actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {borrowerLoanActions.map((action) => {
              const isWorking = actionState === "working";
              const disableAction = action === "Send notes" && !noteText.trim();
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => onAction(action)}
                  disabled={isWorking || disableAction}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    isWorking || disableAction
                      ? "cursor-not-allowed border-slate-200 text-slate-300"
                      : "cursor-pointer border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {action}
                </button>
              );
            })}
          </div>
          {actionState === "working" && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
              {actionMessage}
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
      </div>
    </div>
  );
}
