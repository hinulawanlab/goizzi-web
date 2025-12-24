// src/components/borrowers/BorrowerDirectory.tsx

"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import BorrowerTable from "@/components/dashboard/BorrowerTable";
import type { BorrowerSummary, KycStatus, LocationQuality } from "@/shared/types/dashboard";

const kycOptions: KycStatus[] = ["draft", "submitted", "verified", "approved"];
const locationOptions: LocationQuality[] = ["Good", "Needs Update", "Low Confidence"];
const expiryOptions = [
  { value: "any", label: "Any" },
  { value: "7", label: "Expiring in 7 days" },
  { value: "30", label: "Expiring in 30 days" },
  { value: "60", label: "Expiring in 60 days" },
  { value: "90", label: "Expiring in 90 days" }
];

function isExpiringWithin(value: string, days: number) {
  if (!value || value === "N/A" || days <= 0) {
    return false;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return false;
  }

  const diffMs = parsed - Date.now();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

interface BorrowerDirectoryProps {
  borrowers: BorrowerSummary[];
}

export default function BorrowerDirectory({ borrowers }: BorrowerDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("any");
  const [kycFilter, setKycFilter] = useState("any");
  const [missingFilter, setMissingFilter] = useState("any");
  const [expiryFilter, setExpiryFilter] = useState("any");
  const [locationFilter, setLocationFilter] = useState("any");

  const branchOptions = useMemo(() => {
    const uniqueBranches = Array.from(new Set(borrowers.map((borrower) => borrower.branch)));
    uniqueBranches.sort();
    return ["any", ...uniqueBranches];
  }, [borrowers]);

  const filteredBorrowers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return borrowers.filter((borrower) => {
      const matchesSearch =
        !search ||
        [borrower.fullName, borrower.phone, borrower.borrowerId]
          .some((value) => value.toLowerCase().includes(search));

      const matchesBranch = branchFilter === "any" || borrower.branch === branchFilter;
      const matchesKyc = kycFilter === "any" || borrower.kycStatus === kycFilter;
      const matchesMissing =
        missingFilter === "any"
          ? true
          : missingFilter === "with"
            ? borrower.kycMissingCount > 0
            : borrower.kycMissingCount === 0;
      const matchesLocation = locationFilter === "any" || borrower.locationStatus === locationFilter;
      const matchesExpiry =
        expiryFilter === "any" ? true : isExpiringWithin(borrower.idExpiryDate, Number(expiryFilter));

      return matchesSearch && matchesBranch && matchesKyc && matchesMissing && matchesLocation && matchesExpiry;
    });
  }, [borrowers, searchTerm, branchFilter, kycFilter, missingFilter, expiryFilter, locationFilter]);

  const activeFiltersCount = [
    searchTerm.trim().length > 0,
    branchFilter !== "any",
    kycFilter !== "any",
    missingFilter !== "any",
    expiryFilter !== "any",
    locationFilter !== "any"
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setBranchFilter("any");
    setKycFilter("any");
    setMissingFilter("any");
    setExpiryFilter("any");
    setLocationFilter("any");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Borrowers</p>
            <h2 className="text-2xl font-semibold text-slate-900">Borrower directory</h2>
            <p className="text-sm text-slate-500">
              Dense, searchable list that highlights KYC + location quality so teams can prioritize reviews.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <p className="font-semibold text-slate-900">
              Showing {filteredBorrowers.length} of {borrowers.length}
            </p>
            {/* <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Actions happen inside borrower profile</p> */}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Search</span>
            <div className="relative mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Name, phone, or borrower ID"
                className="w-full border-none bg-transparent pl-10 text-sm focus:outline-none"
              />
            </div>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Branch</span>
            <select
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              {branchOptions.map((branch) => (
                <option key={branch} value={branch}>
                  {branch === "any" ? "All branches" : branch}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">KYC status</span>
            <select
              value={kycFilter}
              onChange={(event) => setKycFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="any">All statuses</option>
              {kycOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Missing docs</span>
            <select
              value={missingFilter}
              onChange={(event) => setMissingFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="with">With missing docs</option>
              <option value="without">Complete KYC</option>
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">ID expiry</span>
            <select
              value={expiryFilter}
              onChange={(event) => setExpiryFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              {expiryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Location status</span>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="any">All location quality</option>
              {locationOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          <span>Active filters: {activeFiltersCount || "None"}</span>
          <button
            type="button"
            onClick={clearFilters}
            disabled={activeFiltersCount === 0}
            className="rounded-full border border-[#1877f2] px-4 py-2 text-[#1877f2] transition hover:bg-[#1877f2]/10 disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            Clear filters
          </button>
        </div>
      </section>

      {filteredBorrowers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">No borrowers match the current filters.</p>
          <p className="mt-2 text-xs text-slate-500">Reset the filters or return later when new borrowers are available.</p>
        </div>
      ) : (
        <BorrowerTable borrowers={filteredBorrowers} showViewAll={false} />
      )}
    </div>
  );
}
