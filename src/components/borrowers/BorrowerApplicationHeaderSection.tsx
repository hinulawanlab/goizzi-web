"use client";

import type { TabKey } from "@/components/borrowers/borrowerApplicationTypes";
import { tabs } from "@/components/borrowers/borrowerApplicationTypes";

interface BorrowerApplicationHeaderSectionProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function BorrowerApplicationHeaderSection({
  activeTab,
  onTabChange
}: BorrowerApplicationHeaderSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Application details</p>
          <h2 className="text-2xl font-semibold text-black/80">Borrower and loan insights</h2>
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
