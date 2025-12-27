"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import type { BorrowerFollowUpSummary } from "@/shared/types/borrowerFollowUp";

interface BorrowerFollowUpGateModalProps {
  followUps: BorrowerFollowUpSummary[];
  currentBorrowerId?: string;
}

export default function BorrowerFollowUpGateModal({ followUps, currentBorrowerId }: BorrowerFollowUpGateModalProps) {
  const [isOpen, setIsOpen] = useState(followUps.length > 0);
  const router = useRouter();

  const totalCount = useMemo(
    () => followUps.reduce((total, entry) => total + (Number.isFinite(entry.followUpCount) ? entry.followUpCount : 0), 0),
    [followUps]
  );

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelect = (borrowerId: string) => {
    setIsOpen(false);
    if (borrowerId && borrowerId !== currentBorrowerId) {
      router.push(`/borrowers/${borrowerId}`);
    }
  };

  if (!isOpen || followUps.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0 cursor-default bg-slate-900/60"
        aria-label="Close follow-up list"
      />
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            {/* <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Follow-up queue</p> */}
            <h3 className="text-xl font-semibold text-slate-900">Needing your attention</h3>
            <p className="text-sm text-slate-500">
              {followUps.length} borrower{followUps.length === 1 ? "" : "s"} with {totalCount} follow-up
              {totalCount === 1 ? "" : "s"}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50">
          <div className="grid grid-cols-1 gap-2 border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 sm:grid-cols-[2fr_1.2fr_0.7fr_1fr]">
            <span>Borrower</span>
            <span>Branch</span>
            <span>Count</span>
            <span>Follow-up at</span>
          </div>
          <div className="max-h-105 overflow-y-auto">
            {followUps.map((entry) => (
              <button
                key={entry.borrowerId}
                type="button"
                onClick={() => handleSelect(entry.borrowerId)}
                className="cursor-pointer grid w-full grid-cols-1 items-center gap-2 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition last:border-b-0 hover:bg-white sm:grid-cols-[2fr_1.2fr_0.7fr_1fr]"
              >
                <div>
                  <p className="font-semibold text-slate-900">{entry.fullName}</p>
                  <p className="text-xs text-slate-500">{entry.phone}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{entry.branch}</span>
                <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  {entry.followUpCount}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{entry.followUpAt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
