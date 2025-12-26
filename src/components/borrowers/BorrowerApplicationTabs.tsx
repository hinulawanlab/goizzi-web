"use client";

import { useState } from "react";

import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LoanApplication } from "@/shared/types/loanApplication";

type TabKey = "maker" | "comakers" | "documents";

interface BorrowerApplicationTabsProps {
  borrower: BorrowerSummary;
  application: LoanApplication;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "maker", label: "Maker's details" },
  { key: "comakers", label: "Co-makers" },
  { key: "documents", label: "Loan documents" }
];

const documentGroups = [
  { title: "Bank statements", description: "Placeholder for bank statement uploads." },
  { title: "Payslips", description: "Placeholder for payslip uploads." },
  { title: "Property titles", description: "Placeholder for property title uploads." },
  { title: "Others", description: "Placeholder for other supporting documents." }
];

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

function formatAmount(value?: string) {
  if (!value || value === "N/A") {
    return "N/A";
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return parsed.toLocaleString("en-US");
}

function DetailRow({ label, value }: { label: string; value?: string | boolean }) {
  const displayValue = typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "N/A";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{displayValue}</p>
    </div>
  );
}

export default function BorrowerApplicationTabs({ borrower, application }: BorrowerApplicationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("maker");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Application details</p>
            <h2 className="text-2xl font-semibold text-slate-900">Borrower and loan insights</h2>
            <p className="text-sm text-slate-500">
              Review maker details, co-maker information, and loan documents in one place.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <p className="font-semibold text-slate-900">{tabs.length} tabs</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Grouped records</p>
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
      </section>

      {activeTab === "maker" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Borrower snapshot</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {application.borrower.fullName ?? borrower.fullName}
            </p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Mobile" value={application.borrower.mobileNumber} />
              <DetailRow label="Email" value={application.borrower.email} />
              <DetailRow label="Date of birth" value={application.borrower.dateOfBirth} />
              <DetailRow label="Civil status" value={application.borrower.civilStatus} />
              <DetailRow label="Current address" value={application.borrower.currentAddress} />
              <DetailRow label="Provincial same as current" value={application.borrower.provincialSameAsCurrent} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loan details</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Product" value={application.loanDetails?.productName} />
              <DetailRow label="Product ID" value={application.loanDetails?.productId} />
              <DetailRow label="Amount applied" value={formatAmount(application.loanDetails?.amountApplied)} />
              <DetailRow label="Term" value={application.loanDetails?.term} />
              <DetailRow label="Purpose" value={application.loanDetails?.purpose} />
              <DetailRow label="Submitted" value={formatDate(application.submittedAt ?? application.createdAt)} />
              <DetailRow label="Loan status" value={application.status} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Employment & income</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Employer" value={application.borrowerIncome?.employerName} />
              <DetailRow label="Occupation" value={application.borrowerIncome?.occupation} />
              <DetailRow label="Net income" value={application.borrowerIncome?.netIncome} />
              <DetailRow label="Years in role" value={application.borrowerIncome?.yearsInRole} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Spouse</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Full name" value={application.spouse?.fullName} />
              <DetailRow label="Occupation" value={application.spouse?.occupation} />
              <DetailRow label="Net income" value={application.spouse?.netIncome} />
              <DetailRow label="Contact" value={application.spouse?.contactNumber} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Assets & marketing</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Assets" value={application.borrowerAssets?.selections?.join(", ")} />
              <DetailRow label="Estimated value" value={application.borrowerAssets?.estimatedValue} />
              <DetailRow label="Asset notes" value={application.borrowerAssets?.details} />
              <DetailRow label="Marketing source" value={application.marketing?.source} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Audit</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Created" value={formatDate(application.createdAt)} />
              <DetailRow label="Submitted" value={formatDate(application.submittedAt)} />
              <DetailRow label="Updated" value={formatDate(application.updatedAt)} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "comakers" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Co-maker</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Full name" value={application.coMaker?.fullName} />
              <DetailRow label="Relationship" value={application.coMaker?.relationshipToBorrower} />
              <DetailRow label="Mobile" value={application.coMaker?.mobileNumber} />
              <DetailRow label="Address" value={application.coMaker?.currentAddress} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Co-maker income</p>
            <div className="mt-4 grid gap-3">
              <DetailRow label="Employer" value={application.coMakerIncome?.employerName} />
              <DetailRow label="Net income" value={application.coMakerIncome?.netIncome} />
              <DetailRow label="Occupation" value={application.coMakerIncome?.occupation} />
              <DetailRow label="Years in role" value={application.coMakerIncome?.yearsInRole} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="grid gap-4 md:grid-cols-2">
          {documentGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{group.title}</p>
              <p className="mt-3 text-sm text-slate-600">{group.description}</p>
              <p className="mt-2 text-xs text-slate-400">Logic will be added in a later iteration.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
