"use client";

import { useMemo, useState } from "react";

import LocationTab from "@/components/borrowers/LocationTab";
import BorrowerApplicationsTable from "@/components/borrowers/BorrowerApplicationsTable";
import BorrowerLoansTable from "@/components/borrowers/BorrowerLoansTable";
import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LoanApplication } from "@/shared/types/loanApplication";
import type { LoanSummary } from "@/shared/types/loan";
import type { LocationObservation } from "@/shared/types/location";

type TabKey = "location" | "submitted" | "active" | "completed";

interface BorrowerProfileTabsProps {
  borrower: BorrowerSummary;
  observations: LocationObservation[];
  topSourcesCount?: number;
  topAreaLocation?: {
    lat: number;
    lng: number;
    label?: string;
    capturedAt?: string;
  };
  applications: LoanApplication[];
  loans: LoanSummary[];
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "location", label: "Map & location" },
  { key: "submitted", label: "Submitted loans" },
  { key: "active", label: "Active loans" },
  { key: "completed", label: "Completed loans" }
];

export default function BorrowerProfileTabs({
  borrower,
  observations,
  topSourcesCount,
  topAreaLocation,
  applications,
  loans
}: BorrowerProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("location");

  const submittedApplications = useMemo(
    () => applications.filter((application) => application.status === "submitted"),
    [applications]
  );

  const activeLoans = useMemo(
    () => loans.filter((loan) => loan.status === "active" || loan.status === "delinquent"),
    [loans]
  );

  const completedLoans = useMemo(
    () => loans.filter((loan) => loan.status === "closed" || loan.status === "writtenOff"),
    [loans]
  );

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Borrower activity</p>
          <h2 className="text-2xl font-semibold text-slate-900">Locations & loans</h2>
          <p className="text-sm text-slate-500">
            Track location intelligence, submitted applications, and loan performance in one place.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          <p className="font-semibold text-slate-900">{loans.length + submittedApplications.length} records</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Across all tabs</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              activeTab === tab.key
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "location" && (
          <LocationTab
            borrower={borrower}
            observations={observations}
            topSourcesCount={topSourcesCount}
            topAreaLocation={topAreaLocation}
          />
        )}

        {activeTab === "submitted" && (
          <BorrowerApplicationsTable borrowerId={borrower.borrowerId} applications={submittedApplications} />
        )}

        {activeTab === "active" && (
          <BorrowerLoansTable
            loans={activeLoans}
            emptyTitle="No active loans yet."
            emptySubtitle="Active loans will appear here once they are posted."
          />
        )}

        {activeTab === "completed" && (
          <BorrowerLoansTable
            loans={completedLoans}
            emptyTitle="No completed loans yet."
            emptySubtitle="Closed or written-off loans will appear here when available."
          />
        )}
      </div>
    </section>
  );
}
