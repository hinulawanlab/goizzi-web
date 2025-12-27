"use client";

import { RefreshCw } from "lucide-react";

import type { TabKey } from "@/components/borrowers/borrowerApplicationTypes";
import { tabs } from "@/components/borrowers/borrowerApplicationTypes";

interface BorrowerApplicationHeaderSectionProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function BorrowerApplicationHeaderSection({
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing = false
}: BorrowerApplicationHeaderSectionProps) {
  return (
    <section className="relative rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
      <div className="absolute right-4 top-4">
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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Application details</p>
          <h2 className="text-2xl font-semibold text-black/90">Borrower and loan insights</h2>
          <p className="text-sm text-slate-500">
            Review maker details, co-maker information, references, proof of billing, and loan documents.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
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
