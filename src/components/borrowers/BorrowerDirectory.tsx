// src/components/borrowers/BorrowerDirectory.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import BorrowerTable from "@/components/dashboard/BorrowerTable";
import type { BorrowerSummary, KycVerificationStatus, LocationQuality } from "@/shared/types/dashboard";

const kycOptions: { value: KycVerificationStatus; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "not_verified", label: "Not verified" },
  { value: "needs_update", label: "Needs update" }
];
const locationOptions: LocationQuality[] = ["Good", "Needs Update", "Low Confidence"];
const pageSizeOptions = [25, 50, 100, 200];

interface BorrowerDirectoryProps {
  borrowers: BorrowerSummary[];
  total: number;
  pageSize: number;
}

interface BorrowerDirectoryResponse {
  borrowers: BorrowerSummary[];
  total: number;
  page: number;
  pageSize: number;
}

interface BorrowerSearchSuggestion {
  borrowerId: string;
  fullName: string;
  phone: string;
  branch: string;
}

function getKycStatusKey(value: boolean | null): KycVerificationStatus {
  if (value === true) {
    return "verified";
  }
  if (value === false) {
    return "not_verified";
  }
  return "needs_update";
}

async function fetchBorrowerDirectoryPage(page: number, pageSize: number, searchTerm: string): Promise<BorrowerDirectoryResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize)
  });
  if (searchTerm.trim()) {
    params.set("search", searchTerm.trim());
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(`/api/borrowers/directory?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error("Unable to fetch borrower directory.");
  }

  return (await response.json()) as BorrowerDirectoryResponse;
}

async function fetchBorrowerSuggestions(searchTerm: string): Promise<BorrowerSearchSuggestion[]> {
  const params = new URLSearchParams({
    q: searchTerm.trim(),
    limit: "8"
  });

  const response = await fetch(`/api/borrowers/directory/suggestions?${params.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to fetch borrower suggestions.");
  }

  const payload = (await response.json()) as { suggestions?: BorrowerSearchSuggestion[] };
  return payload.suggestions ?? [];
}

function buildPageItems(currentPage: number, totalPages: number): Array<number | string> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | string> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    items.push("left-ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push("right-ellipsis");
  }

  items.push(totalPages);
  return items;
}

export default function BorrowerDirectory({ borrowers, total, pageSize }: BorrowerDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("any");
  const [kycFilter, setKycFilter] = useState("any");
  const [missingFilter, setMissingFilter] = useState("any");
  const [locationFilter, setLocationFilter] = useState("any");
  const [displayBorrowers, setDisplayBorrowers] = useState<BorrowerSummary[]>(borrowers);
  const [totalBorrowers, setTotalBorrowers] = useState(total);
  const [currentPage, setCurrentPage] = useState(1);
  const [effectivePageSize, setEffectivePageSize] = useState(pageSize);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<BorrowerSearchSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const didHydrateRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!didHydrateRef.current) {
      didHydrateRef.current = true;
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchBorrowerDirectoryPage(currentPage, effectivePageSize, debouncedSearchTerm);
        if (cancelled) {
          return;
        }
        setDisplayBorrowers(result.borrowers);
        setTotalBorrowers(result.total);
        setEffectivePageSize(result.pageSize);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to fetch borrower directory.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [currentPage, debouncedSearchTerm, effectivePageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const normalizedTerm = searchTerm.trim();
    if (normalizedTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const nextSuggestions = await fetchBorrowerSuggestions(normalizedTerm);
        if (!cancelled) {
          setSuggestions(nextSuggestions);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsSuggesting(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchTerm]);

  const branchOptions = useMemo(() => {
    const uniqueBranches = Array.from(new Set(displayBorrowers.map((borrower) => borrower.branch)));
    uniqueBranches.sort();
    return ["any", ...uniqueBranches];
  }, [displayBorrowers]);

  const filteredBorrowers = useMemo(() => {
    return displayBorrowers.filter((borrower) => {
      const matchesBranch = branchFilter === "any" || borrower.branch === branchFilter;
      const matchesKyc = kycFilter === "any" || getKycStatusKey(borrower.isKYCverified) === kycFilter;
      const missingCount = borrower.kycMissingCount;
      const matchesMissing =
        missingFilter === "any"
          ? true
          : missingFilter === "with"
            ? missingCount !== null && missingCount > 0
            : missingCount === 0;
      const matchesLocation = locationFilter === "any" || borrower.locationStatus === locationFilter;

      return matchesBranch && matchesKyc && matchesMissing && matchesLocation;
    });
  }, [displayBorrowers, branchFilter, kycFilter, missingFilter, locationFilter]);

  const activeFiltersCount = [
    searchTerm.trim().length > 0,
    branchFilter !== "any",
    kycFilter !== "any",
    missingFilter !== "any",
    locationFilter !== "any"
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setBranchFilter("any");
    setKycFilter("any");
    setMissingFilter("any");
    setLocationFilter("any");
    setSuggestions([]);
  };

  const totalPages = Math.max(1, Math.ceil(totalBorrowers / Math.max(effectivePageSize, 1)));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSelectSuggestion = (suggestion: BorrowerSearchSuggestion) => {
    setSearchTerm(suggestion.fullName);
    setSuggestions([]);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setEffectivePageSize(value);
    setCurrentPage(1);
  };

  const pageItems = useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

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
              Showing {filteredBorrowers.length} of {totalBorrowers}
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Page {currentPage} of {totalPages}</p>
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Rows</span>
              <select
                value={effectivePageSize}
                onChange={(event) => handlePageSizeChange(Number.parseInt(event.target.value, 10))}
                className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="relative md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Search</span>
            <div className="relative mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => {
                    setIsSearchFocused(false);
                  }, 120);
                }}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Name, phone, or borrower ID"
                className="w-full border-none bg-transparent pl-10 text-sm focus:outline-none"
              />
            </div>
            {isSearchFocused && searchTerm.trim().length >= 2 && (
              <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                {isSuggesting ? (
                  <p className="px-2 py-2 text-xs text-slate-500">Searching...</p>
                ) : suggestions.length ? (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.borrowerId}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full rounded-xl px-2 py-2 text-left text-sm transition hover:bg-slate-100"
                    >
                      <span className="block font-semibold text-slate-900">{suggestion.fullName}</span>
                      <span className="block text-xs text-slate-500">{suggestion.borrowerId} • {suggestion.phone} • {suggestion.branch}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-2 text-xs text-slate-500">No suggestions found.</p>
                )}
              </div>
            )}
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
                <option key={status.value} value={status.value}>
                  {status.label}
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

      {errorMessage ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">{errorMessage}</p>
        </div>
      ) : isLoading ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">Loading borrowers...</p>
        </div>
      ) : (
        <>
          {filteredBorrowers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-900">No borrowers match the current filters.</p>
              <p className="mt-2 text-xs text-slate-500">Reset the filters or return later when new borrowers are available.</p>
            </div>
          ) : (
            <BorrowerTable borrowers={filteredBorrowers} showViewAll={false} />
          )}
          {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.max(value - 1, 1))}
              disabled={currentPage === 1 || isLoading}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>

            {pageItems.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <span key={`${item}-${index}`} className="px-2 text-sm text-slate-400">
                    ...
                  </span>
                );
              }

              const isActive = item === currentPage;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                  disabled={isLoading}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    isActive
                      ? "border-[#1877f2] bg-[#1877f2] text-white"
                      : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {item}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.min(value + 1, totalPages))}
              disabled={currentPage >= totalPages || isLoading}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
          )}
        </>
      )}
    </div>
  );
}

