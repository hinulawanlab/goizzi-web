"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDownloadURL, ref } from "firebase/storage";

import { storage } from "@/shared/singletons/firebase";
import type { BorrowerGovernmentIdKyc } from "@/shared/types/kyc";

type LoadState = "idle" | "loading" | "success" | "error";
type ActionState = "idle" | "working" | "success" | "error";

interface BorrowerSelfieModalProps {
  kycs: BorrowerGovernmentIdKyc[];
  borrowerName?: string;
}

function normalizeStoragePath(path?: string): string | null {
  if (!path) {
    return null;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/^\/+/, "");
}

export default function BorrowerSelfieModal({ kycs, borrowerName }: BorrowerSelfieModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approvalOverrides, setApprovalOverrides] = useState<Record<string, boolean>>({});

  const currentKyc = kycs[currentIndex] ?? null;
  const currentStorageRef = currentKyc?.storageRefs?.[0];

  const hasAnySelfies = useMemo(
    () => kycs.some((entry) => Boolean(entry.storageRefs && entry.storageRefs.length > 0)),
    [kycs]
  );

  const buttonLabel = useMemo(() => {
    if (!hasAnySelfies) {
      return "No selfie on file";
    }
    if (loadState === "loading") {
      return "Loading selfie...";
    }
    return "View borrower's selfie";
  }, [hasAnySelfies, loadState]);

  const approvalStatus =
    currentKyc && currentKyc.kycId in approvalOverrides
      ? approvalOverrides[currentKyc.kycId]
      : currentKyc?.isApproved ?? null;

  const approvalLabel = approvalStatus === null ? "Pending review" : approvalStatus ? "Approved" : "Rejected";
  const totalKycs = kycs.length;
  const canNavigateLeft = currentIndex > 0;
  const canNavigateRight = currentIndex < totalKycs - 1;

  const openModal = () => {
    setCurrentIndex(0);
    setIsOpen(true);
    setLoadState("idle");
    setErrorMessage(null);

    if (!hasAnySelfies) {
      setLoadState("error");
      setErrorMessage("No selfie images are available for this borrower.");
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    if (loadState === "error") {
      setLoadState("idle");
      setErrorMessage(null);
    }
    if (actionState === "error" || actionState === "success") {
      setActionState("idle");
      setActionMessage(null);
    }
  };

  const submitApproval = async (isApprove: boolean) => {
    if (!currentKyc?.borrowerId || !currentKyc?.kycId) {
      setActionState("error");
      setActionMessage("KYC record is missing. Refresh the page and try again.");
      return;
    }

    setActionState("working");
    setActionMessage("Updating approval...");

    try {
      const response = await fetch(
        `/api/borrowers/${currentKyc.borrowerId}/kyc/${currentKyc.kycId}/approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isApproved: isApprove })
        }
      );

      if (!response.ok) {
        throw new Error("Approval update failed.");
      }

      setApprovalOverrides((prev) => ({ ...prev, [currentKyc.kycId]: isApprove }));
      setActionState("success");
      setActionMessage(isApprove ? "Selfie approved." : "Selfie rejected.");
    } catch (error) {
      console.warn("Unable to update approval:", error);
      setActionState("error");
      setActionMessage("Unable to update approval. Please retry.");
    }
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [kycs]);

  useEffect(() => {
    if (!isOpen || !currentKyc) {
      return;
    }

    const selfiePath = normalizeStoragePath(currentStorageRef ?? undefined);

    setLoadState("loading");
    setImageUrl(null);
    setErrorMessage(null);
    setActionState("idle");
    setActionMessage(null);

    if (!selfiePath) {
      setLoadState("error");
      setErrorMessage("No selfie image is available for this record.");
      return;
    }

    let cancelled = false;

    getDownloadURL(ref(storage, selfiePath))
      .then((url) => {
        if (cancelled) {
          return;
        }
        setImageUrl(url);
        setLoadState("success");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.warn("Unable to load selfie:", error);
        setLoadState("error");
        setErrorMessage("Selfie image could not be loaded. Please retry.");
      });

    return () => {
      cancelled = true;
    };
  }, [currentKyc, currentStorageRef, isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={!hasAnySelfies || loadState === "loading"}
        className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
          !hasAnySelfies || loadState === "loading"
            ? "cursor-not-allowed border-slate-200 text-slate-400"
            : "cursor-pointer border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
        }`}
      >
        {loadState === "loading" && (
          <span className="inline-flex h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent" />
        )}
        {buttonLabel}
      </button>

      {loadState === "error" && !isOpen && errorMessage && (
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-rose-500">{errorMessage}</p>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 cursor-default bg-slate-900/60"
            aria-label="Close selfie viewer"
          />
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Borrower selfie</p>
                <h3 className="text-xl font-semibold text-slate-900">Selfie verification</h3>
                <p className="text-sm text-slate-500">{borrowerName ?? "Borrower"}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Submitted: {currentKyc?.createdAt ?? "Unknown"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={!canNavigateLeft}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    canNavigateLeft
                      ? "cursor-pointer border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                      : "cursor-not-allowed border-slate-200 text-slate-300"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {totalKycs ? `Selfie ${currentIndex + 1} of ${totalKycs}` : "No selfies"}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, totalKycs - 1))}
                  disabled={!canNavigateRight}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    canNavigateRight
                      ? "cursor-pointer border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                      : "cursor-not-allowed border-slate-200 text-slate-300"
                  }`}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 hover:border-slate-300 hover:text-slate-900"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">KYC decision</p>
                    <p className="mt-2 text-sm text-slate-700">Status: {approvalLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => submitApproval(true)}
                      disabled={!currentKyc || actionState === "working"}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                        !currentKyc || actionState === "working"
                          ? "cursor-not-allowed border-emerald-200 text-emerald-300"
                          : "cursor-pointer border-emerald-400 text-emerald-600 hover:border-emerald-500 hover:text-emerald-700"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => submitApproval(false)}
                      disabled={!currentKyc || actionState === "working"}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                        !currentKyc || actionState === "working"
                          ? "cursor-not-allowed border-rose-200 text-rose-300"
                          : "cursor-pointer border-rose-400 text-rose-600 hover:border-rose-500 hover:text-rose-700"
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {actionState === "working" && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                    {actionMessage}
                  </div>
                )}
                {actionState === "success" && actionMessage && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {actionMessage}
                  </div>
                )}
                {actionState === "error" && actionMessage && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {actionMessage}
                  </div>
                )}
              </div>

              {loadState === "loading" && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                  Loading selfie image...
                </div>
              )}

              {loadState === "error" && errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                  {errorMessage}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={openModal}
                      className="cursor-pointer rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-600 hover:border-rose-300 hover:text-rose-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {loadState === "success" && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Selfie</p>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="Borrower selfie"
                      width={1200}
                      height={1200}
                      unoptimized
                      className="mt-3 w-full rounded-xl border border-slate-200 object-contain"
                    />
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">Selfie image unavailable.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
