// src/components/dashboard/BorrowerTable.tsx

"use client";

import { useRouter } from "next/navigation";
import type { BorrowerSummary, KycStatus, LocationQuality } from "@/shared/types/dashboard";

interface BorrowerTableProps {
  borrowers: BorrowerSummary[];
  showViewAll?: boolean;
}

const statusPillClass: Record<KycStatus, string> = {
  submitted: "bg-amber-100 text-amber-700",
  verified: "bg-sky-100 text-sky-700",
  approved: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-700"
};

const locationClass: Record<LocationQuality, string> = {
  Good: "text-emerald-600",
  "Needs Update": "text-amber-600",
  "Low Confidence": "text-rose-600"
};

function renderBorrowerRow(borrower: BorrowerSummary, index: number, router: ReturnType<typeof useRouter>) {
  const handleClick = () => {
    router.push(`/borrowers/${borrower.borrowerId}`);
  };

  return (
    <tr
      key={borrower.borrowerId}
      onClick={handleClick}
      className={`transition ${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 cursor-pointer`}
    >
      <td className="px-3 py-4">
        <strong className="block text-base text-slate-900">{borrower.fullName}</strong>
        <span className="text-xs text-slate-500">{borrower.phone}</span>
      </td>
      <td className="px-3 py-4 text-slate-700">{borrower.branch}</td>
      <td className="px-3 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusPillClass[borrower.kycStatus]}`}
        >
          {borrower.kycStatus}
        </span>
      </td>
      <td className="px-3 py-4">{borrower.kycMissingCount}</td>
      <td className="px-3 py-4">
        <span className="text-sm text-slate-700">{borrower.idExpiryDate}</span>
        {borrower.idExpiringSoon && (
          <span className="ml-2 rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-600">Expiring</span>
        )}
      </td>
      <td className="px-3 py-4">
        <span className={`${locationClass[borrower.locationStatus]} text-sm font-semibold`}>
          {borrower.locationStatus}
        </span>
      </td>
      <td className="px-3 py-4">{borrower.topAreaLabel}</td>
      <td className="px-3 py-4">{borrower.lastLocationAt}</td>
      <td className="px-3 py-4">{borrower.lastUpdated}</td>
    </tr>
  );
}

export default function BorrowerTable({ borrowers, showViewAll = true }: BorrowerTableProps) {
  const router = useRouter();
  const rowElements = borrowers.map((borrower, index) => renderBorrowerRow(borrower, index, router));

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between px-2 text-sm text-slate-500">
        {showViewAll && (
          <button className="text-xs uppercase tracking-[0.3em] text-[#1877f2]">View all</button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-200px text-left text-sm text-slate-600">
          <thead>
            <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
              <th className="px-3 py-3">Borrower</th>
              <th className="px-3 py-3">Branch</th>
              <th className="px-3 py-3">KYC Status</th>
              <th className="px-3 py-3">Missing</th>
              <th className="px-3 py-3">ID Expiry</th>
              <th className="px-3 py-3">Location</th>
              <th className="px-3 py-3">Top Area</th>
              <th className="px-3 py-3">Last Location</th>
              <th className="px-3 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{rowElements}</tbody>
        </table>
      </div>
    </div>
  );
}
