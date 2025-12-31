// src/components/dashboard/BorrowerTable.tsx

"use client";

import { useRouter } from "next/navigation";
import type { BorrowerSummary, KycVerificationStatus, LocationQuality } from "@/shared/types/dashboard";

interface BorrowerTableProps {
  borrowers: BorrowerSummary[];
  showViewAll?: boolean;
}

const statusPillClass: Record<KycVerificationStatus, string> = {
  verified: "bg-emerald-100 text-emerald-700",
  not_verified: "bg-rose-100 text-rose-700",
  needs_update: "bg-amber-100 text-amber-700"
};

const locationClass: Record<LocationQuality, string> = {
  Good: "bg-emerald-100 text-emerald-700",
  "Needs Update": "bg-amber-100 text-amber-700",
  "Low Confidence": "bg-rose-100 text-rose-700"
};

function getKycStatusKey(value: boolean | null): KycVerificationStatus {
  if (value === true) {
    return "verified";
  }
  if (value === false) {
    return "not_verified";
  }
  return "needs_update";
}

function getKycStatusLabel(value: boolean | null): string {
  if (value === true) {
    return "Verified";
  }
  if (value === false) {
    return "Not verified";
  }
  return "Needs update";
}

function renderMissingCount(value: number | null) {
  if (value === null) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
        Needs update
      </span>
    );
  }
  const badgeClass =
    value === 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${badgeClass}`}>
      {value}
    </span>
  );
}

function renderBorrowerRow(borrower: BorrowerSummary, index: number, router: ReturnType<typeof useRouter>) {
  const handleClick = () => {
    router.push(`/borrowers/${borrower.borrowerId}`);
  };

  const kycStatusKey = getKycStatusKey(borrower.isKYCverified);
  const kycStatusLabel = getKycStatusLabel(borrower.isKYCverified);

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
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusPillClass[kycStatusKey]}`}
        >
          {kycStatusLabel}
        </span>
      </td>
      <td className="px-3 py-4">{renderMissingCount(borrower.kycMissingCount)}</td>
      <td className="px-3 py-4">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${locationClass[borrower.locationStatus]}`}>
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
