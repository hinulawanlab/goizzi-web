"use client";

import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LoanSummary } from "@/shared/types/loan";
import type { BorrowerLoanTabKey } from "@/components/borrowers/borrowerLoanTypes";

interface BorrowerLoanTabSectionProps {
  activeTab: BorrowerLoanTabKey;
  borrower: BorrowerSummary;
  loan: LoanSummary;
}

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

function formatAmount(value?: number, currency?: string) {
  if (typeof value !== "number") {
    return "N/A";
  }
  const normalized = value / 100;
  const formatted = normalized.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return currency ? `${currency} ${formatted}` : formatted;
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm text-slate-600 last:border-b-0">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900">{value || "N/A"}</span>
    </div>
  );
}

export default function BorrowerLoanTabSection({ activeTab, borrower, loan }: BorrowerLoanTabSectionProps) {
  if (activeTab === "payments") {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Payments view is being prepared.</p>
        <p className="mt-2 text-xs text-slate-500">Loan payments will appear here once the module is connected.</p>
      </section>
    );
  }

  if (activeTab === "statement") {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Statement of account is coming soon.</p>
        <p className="mt-2 text-xs text-slate-500">We will surface an audit-ready statement for each loan.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loan snapshot</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Loan details</h3>
        <div className="mt-4">
          <DetailRow label="Borrower" value={borrower.fullName} />
          <DetailRow label="Borrower ID" value={borrower.borrowerId} />
          <DetailRow label="Loan ID" value={loan.loanId} />
          <DetailRow label="Status" value={loan.status} />
          <DetailRow label="Product" value={loan.productName ?? loan.productId} />
          <DetailRow label="Principal" value={formatAmount(loan.principalAmount, loan.currency)} />
          <DetailRow label="Outstanding" value={formatAmount(loan.totalOutstandingAmount, loan.currency)} />
          <DetailRow label="Start date" value={formatDate(loan.startDate)} />
          <DetailRow label="Next due" value={formatDate(loan.nextDueDate)} />
          <DetailRow label="Last payment" value={formatDate(loan.lastPaymentAt)} />
          <DetailRow label="Last updated" value={formatDate(loan.updatedAt)} />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next steps</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Loan insights</h3>
        <div className="mt-4 space-y-4 text-sm text-slate-600">
          <p>Track borrower updates, disbursement readiness, and client follow-ups from this workspace.</p>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
            Payments and statement data will be connected in the next iteration.
          </div>
        </div>
      </div>
    </section>
  );
}
