"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { fetchSignedKycImageUrls, type KycSignedImageItem } from "@/shared/services/kycImageService";
import type { BorrowerGovernmentIdKyc } from "@/shared/types/kyc";

type LoadState = "idle" | "loading" | "success" | "error";
type ActionState = "idle" | "working" | "success" | "error";

interface BorrowerGovernmentIdModalProps {
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

function findSignedUrl(items: KycSignedImageItem[], storageRef?: string | null): string | null {
  const normalized = normalizeStoragePath(storageRef ?? undefined);
  if (!normalized) {
    return null;
  }
  const direct = items.find((item) => item.path === normalized);
  if (direct) {
    return direct.url;
  }
  const fileName = normalized.split("/").pop();
  if (!fileName) {
    return null;
  }
  const byFileName = items.find((item) => item.path.endsWith(`/${fileName}`));
  return byFileName?.url ?? null;
}

export default function BorrowerGovernmentIdModal({ kycs, borrowerName }: BorrowerGovernmentIdModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approvalOverrides, setApprovalOverrides] = useState<Record<string, boolean>>({});

  const currentKyc = kycs[currentIndex] ?? null;

  const hasAnyStorageRefs = useMemo(
    () => kycs.some((entry) => Boolean(entry.frontStorageRef || entry.backStorageRef)),
    [kycs]
  );

  const buttonLabel = useMemo(() => {
    if (!hasAnyStorageRefs) {
      return "No ID cards on file";
    }
    if (loadState === "loading") {
      return "Loading ID cards...";
    }
    return "View ID cards";
  }, [hasAnyStorageRefs, loadState]);

  const approvalStatus =
    currentKyc && currentKyc.kycId in approvalOverrides
      ? approvalOverrides[currentKyc.kycId]
      : currentKyc?.isApproved ?? null;

  const openModal = async () => {
    setCurrentIndex(0);
    setIsOpen(true);
    setLoadState("idle");
    setErrorMessage(null);

    if (!hasAnyStorageRefs) {
      setLoadState("error");
      setErrorMessage("No government ID images are available for this borrower.");
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
      setActionMessage(isApprove ? "Government ID approved." : "Government ID rejected.");
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

    const frontPath = normalizeStoragePath(currentKyc.frontStorageRef ?? undefined);
    const backPath = normalizeStoragePath(currentKyc.backStorageRef ?? undefined);

    setLoadState("loading");
    setFrontUrl(null);
    setBackUrl(null);
    setErrorMessage(null);
    setActionState("idle");
    setActionMessage(null);

    if (!frontPath && !backPath) {
      setLoadState("error");
      setErrorMessage("No government ID images are available for this record.");
      return;
    }

    let cancelled = false;

    fetchSignedKycImageUrls(currentKyc.borrowerId, currentKyc.kycId)
      .then(({ items }) => {
        if (cancelled) {
          return;
        }

        const resolvedFront = findSignedUrl(items, frontPath);
        const resolvedBack = findSignedUrl(items, backPath);

        if (!resolvedFront && !resolvedBack) {
          setLoadState("error");
          setErrorMessage("Government ID images could not be loaded. Please retry.");
          return;
        }

        setFrontUrl(resolvedFront);
        setBackUrl(resolvedBack);
        setLoadState("success");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.warn("Unable to load government ID images:", error);
        setLoadState("error");
        setErrorMessage("Government ID images could not be loaded. Please retry.");
      });

    return () => {
      cancelled = true;
    };
  }, [currentKyc, isOpen]);

  const approvalLabel = approvalStatus === null ? "Pending review" : approvalStatus ? "Approved" : "Rejected";
  const totalKycs = kycs.length;
  const canNavigateLeft = currentIndex > 0;
  const canNavigateRight = currentIndex < totalKycs - 1;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={!hasAnyStorageRefs || loadState === "loading"}
        className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
          !hasAnyStorageRefs || loadState === "loading"
            ? "cursor-not-allowed border-slate-200 text-slate-400"
            : "cursor-pointer border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900"
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
            aria-label="Close ID card viewer"
          />
          <div className="relative w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Government ID</p>
                <h3 className="text-xl font-semibold text-slate-900">Borrower identification cards</h3>
                <p className="text-sm text-slate-500">
                  {borrowerName ? `${borrowerName} • ` : ""}ID type: {currentKyc?.idType ?? "Unknown"}
                </p>
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
                  {totalKycs ? `ID ${currentIndex + 1} of ${totalKycs}` : "No IDs"}
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
                  Loading ID images...
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
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Front</p>
                    {frontUrl ? (
                      <Image
                        src={frontUrl}
                        alt="Government ID front"
                        width={1200}
                        height={800}
                        unoptimized
                        className="mt-3 w-full rounded-xl border border-slate-200 object-contain"
                      />
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">Front image unavailable.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Back</p>
                    {backUrl ? (
                      <Image
                        src={backUrl}
                        alt="Government ID back"
                        width={1200}
                        height={800}
                        unoptimized
                        className="mt-3 w-full rounded-xl border border-slate-200 object-contain"
                      />
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">Back image unavailable.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
