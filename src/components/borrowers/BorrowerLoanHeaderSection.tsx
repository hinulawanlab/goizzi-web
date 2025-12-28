"use client";

import { RefreshCw } from "lucide-react";

import LoanStatusBadge from "@/components/borrowers/LoanStatusBadge";
import type { BorrowerLoanTabKey } from "@/components/borrowers/borrowerLoanTypes";
import { borrowerLoanTabs } from "@/components/borrowers/borrowerLoanTypes";

interface BorrowerLoanHeaderSectionProps {
  activeTab: BorrowerLoanTabKey;
  borrowerName: string;
  loanStatus: string;
  onTabChange: (tab: BorrowerLoanTabKey) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function BorrowerLoanHeaderSection({
  activeTab,
  borrowerName,
  loanStatus,
  onTabChange,
  onRefresh,
  isRefreshing = false
}: BorrowerLoanHeaderSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Loan details</p>
          <h2 className="text-2xl font-semibold text-black/90">{borrowerName}</h2>
          <p className="text-sm text-slate-500">
            Review loan activity, payment history, and statement of account for this borrower.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span>Loan status</span>
            <LoanStatusBadge status={loanStatus} />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || !onRefresh}
            className={`inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              isRefreshing || !onRefresh
                ? "cursor-not-allowed border-slate-200 text-slate-300"
                : "cursor-pointer border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            <span className="sr-only">Refresh tab data</span>
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {borrowerLoanTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`rounded-full border px-4 py-2 cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] transition ${
              activeTab === tab.key
                ? "border-slate-900 bg-black/70 text-white"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  );
}
