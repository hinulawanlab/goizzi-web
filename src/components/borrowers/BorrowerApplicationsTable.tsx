// src/components/borrowers/BorrowerApplicationsTable.tsx
"use client";

import LoanStatusBadge from "@/components/borrowers/LoanStatusBadge";
import type { LoanApplication } from "@/shared/types/loanApplication";

interface BorrowerApplicationsTableProps {
  borrowerId: string;
  applications: LoanApplication[];
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

export default function BorrowerApplicationsTable({
  borrowerId,
  applications
}: BorrowerApplicationsTableProps) {
  const handleOpen = (applicationId: string) => {
    const href = `/borrowers/${borrowerId}/application/${applicationId}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  if (!applications.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">No pending applications yet.</p>
        <p className="mt-2 text-xs text-slate-500">Pending applications will appear here when available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between px-2 text-sm text-slate-500">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pending applications</p>
        <span className="text-xs text-slate-500">{applications.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-200px text-left text-sm text-slate-600">
          <thead>
            <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
              <th className="px-3 py-3">Application</th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((application, index) => (
              <tr
                key={application.applicationId}
                onClick={() => handleOpen(application.applicationId)}
                className={`cursor-pointer transition ${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100`}
              >
                <td className="px-3 py-4">
                  <strong className="block text-sm text-slate-900">{application.applicationId}</strong>
                  {/* <span className="text-xs text-slate-500">{application.borrower.fullName ?? "Borrower"}</span> */}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {application.loanDetails?.productName ?? "Loan product"}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {formatAmount(application.loanDetails?.amountApplied)}
                </td>
                <td className="px-3 py-4">
                  <LoanStatusBadge status={application.status} />
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {formatDate(application.submittedAt ?? application.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
