"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { getDownloadURL, ref } from "firebase/storage";

import { storage } from "@/shared/singletons/firebase";
import type { BorrowerProofOfBillingKyc } from "@/shared/types/kyc";

type ActionState = "idle" | "working" | "success" | "error";
type LoadState = "idle" | "loading" | "success" | "error";

interface ProofImageState {
  status: LoadState;
  urls: string[];
  errorMessage?: string;
}

interface BorrowerProofOfBillingPanelProps {
  borrowerId: string;
  kycs: BorrowerProofOfBillingKyc[];
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

function resolveStatusLabel(isApproved?: boolean) {
  if (isApproved === true) {
    return "Approved";
  }
  if (isApproved === false) {
    return "Rejected";
  }
  return "Pending review";
}

export default function BorrowerProofOfBillingPanel({ borrowerId, kycs }: BorrowerProofOfBillingPanelProps) {
  const [imageStates, setImageStates] = useState<Record<string, ProofImageState>>({});
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [approvalOverrides, setApprovalOverrides] = useState<Record<string, boolean>>({});
  const imageStatesRef = useRef(imageStates);
  const isMountedRef = useRef(true);
  const sortedKycs = useMemo(() => {
    return [...kycs].sort((left, right) => {
      const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
      return rightTime - leftTime;
    });
  }, [kycs]);

  useEffect(() => {
    imageStatesRef.current = imageStates;
  }, [imageStates]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    sortedKycs.forEach((kyc) => {
      const refs = kyc.storageRefs ?? [];
      const currentState = imageStatesRef.current[kyc.kycId];
      if (currentState?.status === "loading" || currentState?.status === "success" || currentState?.status === "error") {
        return;
      }

      if (!refs.length) {
        setImageStates((prev) => ({
          ...prev,
          [kyc.kycId]: { status: "success", urls: [] }
        }));
        return;
      }

      setImageStates((prev) => ({
        ...prev,
        [kyc.kycId]: { status: "loading", urls: [] }
      }));

      const normalizedRefs = refs.map(normalizeStoragePath).filter(Boolean) as string[];
      if (!normalizedRefs.length) {
        setImageStates((prev) => ({
          ...prev,
          [kyc.kycId]: { status: "error", urls: [], errorMessage: "No valid storage paths." }
        }));
        return;
      }

      Promise.allSettled(normalizedRefs.map((path) => getDownloadURL(ref(storage, path))))
        .then((results) => {
          if (!isMountedRef.current) {
            return;
          }
          const urls = results
            .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
            .map((result) => result.value);

          if (!urls.length) {
            setImageStates((prev) => ({
              ...prev,
              [kyc.kycId]: { status: "error", urls: [], errorMessage: "Images could not be loaded." }
            }));
            return;
          }

          setImageStates((prev) => ({
            ...prev,
            [kyc.kycId]: { status: "success", urls }
          }));
        })
        .catch((error) => {
          if (!isMountedRef.current) {
            return;
          }
          setImageStates((prev) => ({
            ...prev,
            [kyc.kycId]: { status: "error", urls: [], errorMessage: "Images could not be loaded." }
          }));
        });
    });
  }, [sortedKycs]);

  const submitApproval = async (kycId: string, isApproved: boolean) => {
    if (!borrowerId || !kycId) {
      setActionStates((prev) => ({ ...prev, [kycId]: "error" }));
      setActionMessages((prev) => ({ ...prev, [kycId]: "Missing borrower or KYC id. Refresh and retry." }));
      return;
    }

    setActionStates((prev) => ({ ...prev, [kycId]: "working" }));
    setActionMessages((prev) => ({ ...prev, [kycId]: "Updating approval..." }));

    try {
      const response = await fetch(`/api/borrowers/${borrowerId}/kyc/${kycId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved })
      });

      if (!response.ok) {
        throw new Error("Approval update failed.");
      }

      setActionStates((prev) => ({ ...prev, [kycId]: "success" }));
      setApprovalOverrides((prev) => ({ ...prev, [kycId]: isApproved }));
      setActionMessages((prev) => ({
        ...prev,
        [kycId]: isApproved ? "Proof of billing approved." : "Proof of billing rejected."
      }));
    } catch (error) {
      console.warn("Unable to update proof of billing approval:", error);
      setActionStates((prev) => ({ ...prev, [kycId]: "error" }));
      setActionMessages((prev) => ({ ...prev, [kycId]: "Unable to update approval. Please retry." }));
    }
  };

  if (!sortedKycs.length) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No proof of billing yet</p>
        <p className="mt-3 text-sm text-slate-600">Proof of billing submissions will appear once uploaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedKycs.map((kyc) => {
        const imageState = imageStates[kyc.kycId];
        const actionState = actionStates[kyc.kycId] ?? "idle";
        const effectiveApproval =
          kyc.kycId in approvalOverrides ? approvalOverrides[kyc.kycId] : kyc.isApproved;
        const statusLabel = resolveStatusLabel(effectiveApproval);

        return (
          <section key={kyc.kycId} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Proof of billing</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {kyc.documentType ?? "Document"}
                </h3>
                <p className="text-sm text-slate-500">Submitted: {formatDate(kyc.createdAt)}</p>
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Status: {statusLabel}</div>
            </div>

            <div className="mt-4 max-h-[420px] overflow-y-auto pr-2">
              {imageState?.status === "loading" && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                  Loading images...
                </div>
              )}

              {imageState?.status === "error" && imageState.errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                  {imageState.errorMessage}
                </div>
              )}

              {imageState?.status !== "loading" && imageState?.status !== "error" && (
                <>
                  {imageState?.urls.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {imageState.urls.map((url, index) => (
                        <div
                          key={`${kyc.kycId}-photo-${index}`}
                          className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                        >
                          <Image
                            src={url}
                            alt={`Proof of billing ${index + 1}`}
                            width={320}
                            height={240}
                            unoptimized
                            className="h-44 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                      No images attached for this proof of billing entry.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Decision</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => submitApproval(kyc.kycId, true)}
                  disabled={actionState === "working"}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    actionState === "working"
                      ? "cursor-not-allowed border-emerald-200 text-emerald-300"
                      : "cursor-pointer border-emerald-400 text-emerald-600 hover:border-emerald-500 hover:text-emerald-700"
                  }`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => submitApproval(kyc.kycId, false)}
                  disabled={actionState === "working"}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    actionState === "working"
                      ? "cursor-not-allowed border-rose-200 text-rose-300"
                      : "cursor-pointer border-rose-400 text-rose-600 hover:border-rose-500 hover:text-rose-700"
                  }`}
                >
                  Reject
                </button>
              </div>
              {actionState === "working" && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
                  {actionMessages[kyc.kycId] ?? "Updating approval..."}
                </div>
              )}
              {actionState === "success" && actionMessages[kyc.kycId] && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {actionMessages[kyc.kycId]}
                </div>
              )}
              {actionState === "error" && actionMessages[kyc.kycId] && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {actionMessages[kyc.kycId]}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
