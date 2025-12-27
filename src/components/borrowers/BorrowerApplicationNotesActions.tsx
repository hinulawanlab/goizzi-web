// src/components/borrowers/BorrowerApplicationNotesActions.tsx
"use client";

import { loanActions } from "@/components/borrowers/borrowerApplicationTypes";
import type { ActionState, LoanAction } from "@/components/borrowers/borrowerApplicationTypes";

interface BorrowerApplicationNotesActionsProps {
  noteText: string;
  noteActionState: ActionState;
  noteActionMessage: string;
  statusActionState: ActionState;
  statusActionMessage: string;
  onNoteTextChange: (value: string) => void;
  onAddNote: () => void;
  onStatusChange: (status: LoanAction) => void;
}

export default function BorrowerApplicationNotesActions({
  noteText,
  noteActionState,
  noteActionMessage,
  statusActionState,
  statusActionMessage,
  onNoteTextChange,
  onAddNote,
  onStatusChange
}: BorrowerApplicationNotesActionsProps) {
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
            placeholder="Write a note for this loan application."
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
            {loanActions.map((action) => {
              const isWorking = statusActionState === "working";
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => onStatusChange(action)}
                  disabled={isWorking}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    isWorking
                      ? "cursor-not-allowed border-slate-200 text-slate-300"
                      : "cursor-pointer border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {action}
                </button>
              );
            })}
          </div>
          {statusActionState === "working" && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
              {statusActionMessage}
            </div>
          )}
          {statusActionState === "success" && statusActionMessage && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {statusActionMessage}
            </div>
          )}
          {statusActionState === "error" && statusActionMessage && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {statusActionMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
