"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { getDownloadURL, ref } from "firebase/storage";

import { auth, storage } from "@/shared/singletons/firebase";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { BorrowerProofOfBillingKyc } from "@/shared/types/kyc";

type ActionState = "idle" | "working" | "success" | "error";
type LoadState = "idle" | "loading" | "success" | "error";

const DOWNLOAD_TIMEOUT_MS = 10000;
const AUTH_TIMEOUT_MS = 8000;

interface ProofImageState {
  status: LoadState;
  urls: string[];
  errorMessage?: string;
}

interface BorrowerProofOfBillingPanelProps {
  borrowerId: string;
  applicationId: string;
  kycs: BorrowerProofOfBillingKyc[];
  onDecisionNoteAdded?: (note: BorrowerNote) => void;
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

function isTimeoutError(error: unknown) {
  if (!error) {
    return false;
  }
  if (typeof error === "string") {
    return error === "timeout";
  }
  if (typeof error === "object" && "name" in error) {
    return (error as { name?: string }).name === "TimeoutError";
  }
  return false;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error("timeout");
      timeoutError.name = "TimeoutError";
      reject(timeoutError);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

async function fetchDownloadUrlWithRetry(path: string, attempts = 2): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await withTimeout(getDownloadURL(ref(storage, path)), DOWNLOAD_TIMEOUT_MS);
    } catch (error) {
      lastError = error;
      if (isTimeoutError(error) && attempt < attempts) {
        console.warn("Proof of billing image download timed out; retrying.", {
          path,
          attempt,
          attempts
        });
        continue;
      }
      break;
    }
  }
  throw lastError;
}

export default function BorrowerProofOfBillingPanel({
  borrowerId,
  applicationId,
  kycs,
  onDecisionNoteAdded
}: BorrowerProofOfBillingPanelProps) {
  const [imageStates, setImageStates] = useState<Record<string, ProofImageState>>({});
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [approvalOverrides, setApprovalOverrides] = useState<Record<string, boolean>>({});
  const [waiveOverrides, setWaiveOverrides] = useState<Record<string, boolean>>({});
  const [authReady, setAuthReady] = useState(() => Boolean(auth.currentUser));
  const [authUserId, setAuthUserId] = useState(() => auth.currentUser?.uid ?? null);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMountedRef.current) {
        return;
      }
      setAuthReady(true);
      setAuthUserId(user?.uid ?? null);
      console.info("Proof of billing auth state changed.", {
        borrowerId,
        hasAuthUser: Boolean(user),
        userId: user?.uid ?? null
      });
    });

    return unsubscribe;
  }, [borrowerId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !authUserId) {
      if (sortedKycs.length > 0) {
        console.warn("Proof of billing image load skipped; auth not ready.", {
          borrowerId,
          authReady,
          authUserId
        });
      }
      return;
    }
    const ensureTokenAndLoad = async () => {
      const user = auth.currentUser;
      if (!user) {
        return;
      }

      try {
        await withTimeout(user.getIdToken(), AUTH_TIMEOUT_MS);
      } catch (error) {
        console.warn("Proof of billing token check failed.", { borrowerId, error });
        if (!isMountedRef.current) {
          return;
        }
        sortedKycs.forEach((kyc) => {
          const currentState = imageStatesRef.current[kyc.kycId];
          if (currentState?.status === "loading" || currentState?.status === "success" || currentState?.status === "error") {
            return;
          }
          setImageStates((prev) => ({
            ...prev,
            [kyc.kycId]: { status: "error", urls: [], errorMessage: "Unable to authenticate for image download." }
          }));
        });
        return;
      }

      if (sortedKycs.length > 0) {
        console.info("Proof of billing KYC load start.", {
          borrowerId,
          kycCount: sortedKycs.length,
          storageBucket: storage.app.options.storageBucket ?? "unknown",
          kycs: sortedKycs.map((kyc) => ({
            kycId: kyc.kycId,
            refCount: kyc.storageRefs?.length ?? 0,
            refs: kyc.storageRefs ?? []
          }))
        });
      }

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
        const debugContext = {
          borrowerId,
          kycId: kyc.kycId,
          rawRefs: refs,
          normalizedRefs
        };
        if (!normalizedRefs.length) {
          console.warn("Proof of billing has no valid storage paths.", debugContext);
          setImageStates((prev) => ({
            ...prev,
            [kyc.kycId]: { status: "error", urls: [], errorMessage: "No valid storage paths." }
          }));
          return;
        }

        const timeoutId = window.setTimeout(() => {
          if (!isMountedRef.current) {
            return;
          }
          const current = imageStatesRef.current[kyc.kycId];
          if (current?.status === "loading") {
            console.warn("Proof of billing image load still pending.", {
              ...debugContext,
              pendingMs: DOWNLOAD_TIMEOUT_MS
            });
          }
        }, DOWNLOAD_TIMEOUT_MS);

        Promise.allSettled(
          normalizedRefs.map((path) => {
            console.info("Proof of billing image download start.", { ...debugContext, path });
            return fetchDownloadUrlWithRetry(path);
          })
        )
          .then((results) => {
            if (!isMountedRef.current) {
              return;
            }
            window.clearTimeout(timeoutId);
            const urls = results
              .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
              .map((result) => result.value);

            const failures = results
              .map((result, index) =>
                result.status === "rejected" ? { path: normalizedRefs[index], error: result.reason } : null
              )
              .filter(Boolean);
            if (failures.length > 0) {
              console.warn("Proof of billing image load failures.", { ...debugContext, failures });
            }

            if (!urls.length) {
              setImageStates((prev) => ({
                ...prev,
                [kyc.kycId]: { status: "error", urls: [], errorMessage: "Images could not be loaded." }
              }));
              return;
            }

            console.info("Proof of billing image URLs resolved.", { ...debugContext, urls });

            setImageStates((prev) => ({
              ...prev,
              [kyc.kycId]: { status: "success", urls }
            }));
          })
          .catch((error) => {
            if (!isMountedRef.current) {
              return;
            }
            window.clearTimeout(timeoutId);
            console.warn("Proof of billing image load error.", { ...debugContext, error });
            setImageStates((prev) => ({
              ...prev,
              [kyc.kycId]: { status: "error", urls: [], errorMessage: "Images could not be loaded." }
            }));
          });
      });
    };

    void ensureTokenAndLoad();
  }, [sortedKycs, borrowerId, authReady, authUserId]);

  type DecisionAction = "approve" | "reject" | "waive" | "unwaive";
  const decisionMessages: Record<DecisionAction, string> = {
    approve: "Proof of billing approved.",
    reject: "Proof of billing rejected.",
    waive: "Proof of billing waived.",
    unwaive: "Proof of billing unwaived."
  };
  const decisionWorkingMessages: Record<DecisionAction, string> = {
    approve: "Updating approval...",
    reject: "Updating approval...",
    waive: "Waiving requirement...",
    unwaive: "Removing waiver..."
  };

  const submitDecision = async (kycId: string, action: DecisionAction) => {
    if (!borrowerId || !applicationId || !kycId) {
      setActionStates((prev) => ({ ...prev, [kycId]: "error" }));
      setActionMessages((prev) => ({ ...prev, [kycId]: "Missing borrower, application, or KYC id. Refresh and retry." }));
      return;
    }

    setActionStates((prev) => ({ ...prev, [kycId]: "working" }));
    setActionMessages((prev) => ({ ...prev, [kycId]: decisionWorkingMessages[action] }));

    const actor = auth.currentUser;

    try {
      const response = await fetch(`/api/borrowers/${borrowerId}/kyc/${kycId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          action,
          actorName: actor?.displayName ?? "Unknown staff",
          actorUserId: actor?.uid ?? null
        })
      });

      if (!response.ok) {
        throw new Error("KYC decision update failed.");
      }

      const payload = (await response.json()) as { note?: BorrowerNote };
      if (payload.note && onDecisionNoteAdded) {
        onDecisionNoteAdded(payload.note);
      }

      setActionStates((prev) => ({ ...prev, [kycId]: "success" }));
      if (action === "approve" || action === "reject") {
        setApprovalOverrides((prev) => ({ ...prev, [kycId]: action === "approve" }));
      }
      if (action === "waive" || action === "unwaive") {
        setWaiveOverrides((prev) => ({ ...prev, [kycId]: action === "waive" }));
      }
      setActionMessages((prev) => ({
        ...prev,
        [kycId]: decisionMessages[action]
      }));
    } catch (error) {
      console.warn("Unable to update proof of billing decision:", error);
      setActionStates((prev) => ({ ...prev, [kycId]: "error" }));
      setActionMessages((prev) => ({ ...prev, [kycId]: "Unable to update decision. Please retry." }));
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
        const effectiveWaived =
          kyc.kycId in waiveOverrides ? waiveOverrides[kyc.kycId] : kyc.isWaived ?? false;
        const statusLabel = resolveStatusLabel(effectiveApproval);
        const waiveLabel = effectiveWaived ? "Unwaive requirement" : "Waive requirement";
        const waiveAction = effectiveWaived ? "unwaive" : "waive";

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
                            onError={(event) => {
                              console.warn("Proof of billing image tag failed to load.", {
                                borrowerId,
                                kycId: kyc.kycId,
                                index,
                                url,
                                message: event.currentTarget?.currentSrc ?? "unknown-src"
                              });
                            }}
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
                  onClick={() => submitDecision(kyc.kycId, "approve")}
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
                  onClick={() => submitDecision(kyc.kycId, "reject")}
                  disabled={actionState === "working"}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    actionState === "working"
                      ? "cursor-not-allowed border-rose-200 text-rose-300"
                      : "cursor-pointer border-rose-400 text-rose-600 hover:border-rose-500 hover:text-rose-700"
                  }`}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => submitDecision(kyc.kycId, waiveAction)}
                  disabled={actionState === "working"}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    actionState === "working"
                      ? "cursor-not-allowed border-slate-200 text-slate-300"
                      : "cursor-pointer border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800"
                  }`}
                >
                  {waiveLabel}
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
