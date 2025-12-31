// src/components/borrowers/BorrowerLoansTable.tsx
"use client";

import { ClipboardEdit, NotepadTextIcon } from "lucide-react";
import type { LoanSummary } from "@/shared/types/loan";

interface BorrowerLoansTableProps {
  borrowerId: string;
  loans: LoanSummary[];
  emptyTitle: string;
  emptySubtitle: string;
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

function getStatusClass(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "delinquent":
      return "bg-rose-100 text-rose-700";
    case "pastdue":
      return "bg-rose-100 text-rose-700";
    case "closed":
      return "bg-slate-100 text-slate-600";
    case "writtenOff":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    case "draft":
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function BorrowerLoansTable({ borrowerId, loans, emptyTitle, emptySubtitle }: BorrowerLoansTableProps) {
  const handleOpen = (loanId: string) => {
    const href = `/borrowers/${borrowerId}/loan/${loanId}?tab=payments`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleOpenApplication = (applicationId: string) => {
    const href = `/borrowers/${borrowerId}/application/${applicationId}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  if (!loans.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">{emptyTitle}</p>
        <p className="mt-2 text-xs text-slate-500">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-200px text-left text-sm text-slate-600">
          <thead>
            <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
              <th className="px-3 py-3">Loan ID</th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Principal</th>
              <th className="px-3 py-3">Outstanding</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((loan, index) => {
              const applicationId = loan.applicationId;
              return (
                <tr
                  key={loan.loanId}
                  className={`transition ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  <td className="px-3 py-4">
                    <strong className="block text-sm text-slate-900">{loan.loanId}</strong>
                  </td>
                  <td className="px-3 py-4 text-slate-700">{loan.productName ?? loan.productId ?? "Loan product"}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStatusClass(
                        loan.status
                      )}`}
                    >
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-slate-700">{formatAmount(loan.principalAmount, loan.currency)}</td>
                  <td className="px-3 py-4 text-slate-700">
                    {formatAmount(loan.totalOutstandingAmount, loan.currency)}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpen(loan.loanId)}
                        title="Open loan"
                        aria-label="Open loan"
                        className="cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
                      >
                        <NotepadTextIcon className="h-4 w-4" aria-hidden />
                      </button>
                      {applicationId ? (
                        <button
                          type="button"
                          onClick={() => handleOpenApplication(applicationId)}
                          title="Open application"
                          aria-label="Open application"
                          className="cursor-pointer rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
                        >
                          <ClipboardEdit className="h-4 w-4" aria-hidden />
                        </button>
                      ) : (
                        <span
                          className="cursor-not-allowed rounded-full border border-dashed border-slate-200 bg-white p-2 text-slate-300"
                          title="No application linked"
                          aria-hidden
                        >
                          <ClipboardEdit className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
