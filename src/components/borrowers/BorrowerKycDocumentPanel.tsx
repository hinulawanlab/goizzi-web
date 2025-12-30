"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import BorrowerKycDecisionSection, {
  type DecisionAction
} from "@/components/borrowers/BorrowerKycDecisionSection";
import BorrowerKycImageViewer from "@/components/borrowers/BorrowerKycImageViewer";
import { useKycImageLoader } from "@/components/borrowers/useKycImageLoader";
import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";
import { auth } from "@/shared/singletons/firebase";
import type { BorrowerNote } from "@/shared/types/borrowerNote";

const MAX_VISIBLE_ROWS = 5;

export interface KycDocumentEntry {
  borrowerId: string;
  kycId: string;
  documentType?: string;
  storageRefs: string[];
  imageUrls?: string[];
  isApproved?: boolean;
  isWaived?: boolean;
  createdAt?: string;
}

export interface KycMetadataField<T extends KycDocumentEntry> {
  label: string;
  value: (entry: T) => string | undefined;
}

interface BorrowerKycDocumentPanelProps<T extends KycDocumentEntry> {
  borrowerId: string;
  applicationId: string;
  title: string;
  sectionLabel: string;
  decisionLabel: string;
  emptyTitle: string;
  emptyMessage: string;
  contextLabel: string;
  kycs: T[];
  metadataFields?: KycMetadataField<T>[];
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

function resolveStatusLabel(isApproved?: boolean) {
  if (isApproved === true) {
    return "Approved";
  }
  if (isApproved === false) {
    return "Rejected";
  }
  return "Pending review";
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value ?? "N/A"}</p>
    </div>
  );
}

function resolveDecisionLabel<T extends KycDocumentEntry>(entry: T, fallback: string) {
  const trimmed = entry.documentType?.trim();
  return trimmed ? trimmed : fallback;
}

export default function BorrowerKycDocumentPanel<T extends KycDocumentEntry>({
  borrowerId,
  applicationId,
  title,
  sectionLabel,
  decisionLabel,
  emptyTitle,
  emptyMessage,
  contextLabel,
  kycs,
  metadataFields,
  onDecisionNoteAdded
}: BorrowerKycDocumentPanelProps<T>) {
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [approvalOverrides, setApprovalOverrides] = useState<Record<string, boolean>>({});
  const [waiveOverrides, setWaiveOverrides] = useState<Record<string, boolean>>({});
  const [viewerImage, setViewerImage] = useState<{ url: string; alt: string } | null>(null);

  const sortedKycs = useMemo(() => {
    return [...kycs].sort((left, right) => {
      const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
      return rightTime - leftTime;
    });
  }, [kycs]);
  const visibleKycs = sortedKycs.slice(0, MAX_VISIBLE_ROWS);
  const imageStates = useKycImageLoader(borrowerId, visibleKycs, {
    contextLabel
  });

  useEffect(() => {
    if (visibleKycs.length > 0) {
      console.info(`${contextLabel} load start.`, {
        borrowerId,
        kycCount: visibleKycs.length,
        kycs: visibleKycs.map((kyc) => ({
          kycId: kyc.kycId,
          refCount: kyc.storageRefs?.length ?? 0,
          refs: kyc.storageRefs ?? []
        }))
      });
    }
  }, [visibleKycs, borrowerId, contextLabel]);

  const decisionWorkingMessages: Record<DecisionAction, string> = {
    approve: "Updating approval...",
    reject: "Updating approval...",
    waive: "Waiving requirement...",
    unwaive: "Removing waiver..."
  };

  const submitDecision = async (entry: T, action: DecisionAction) => {
    if (!borrowerId || !applicationId || !entry.kycId) {
      setActionStates((prev) => ({ ...prev, [entry.kycId]: "error" }));
      setActionMessages((prev) => ({
        ...prev,
        [entry.kycId]: "Missing borrower, application, or KYC id. Refresh and retry."
      }));
      return;
    }

    setActionStates((prev) => ({ ...prev, [entry.kycId]: "working" }));
    setActionMessages((prev) => ({ ...prev, [entry.kycId]: decisionWorkingMessages[action] }));

    const actor = auth.currentUser;
    const noteLabel = resolveDecisionLabel(entry, decisionLabel);

    try {
      const response = await fetch(`/api/borrowers/${borrowerId}/kyc/${entry.kycId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          action,
          documentType: noteLabel,
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

      setActionStates((prev) => ({ ...prev, [entry.kycId]: "success" }));
      if (action === "approve" || action === "reject") {
        setApprovalOverrides((prev) => ({ ...prev, [entry.kycId]: action === "approve" }));
      }
      if (action === "waive" || action === "unwaive") {
        setWaiveOverrides((prev) => ({ ...prev, [entry.kycId]: action === "waive" }));
      }
      setActionMessages((prev) => ({
        ...prev,
        [entry.kycId]: `${noteLabel} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "waive" ? "waived" : "unwaived"}.`
      }));
    } catch (error) {
      console.warn(`Unable to update ${contextLabel} decision:`, error);
      setActionStates((prev) => ({ ...prev, [entry.kycId]: "error" }));
      setActionMessages((prev) => ({ ...prev, [entry.kycId]: "Unable to update decision. Please retry." }));
    }
  };

  if (!visibleKycs.length) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{emptyTitle}</p>
        <p className="mt-3 text-sm text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {visibleKycs.map((entry) => {
          const imageState = imageStates[entry.kycId];
          const actionState = actionStates[entry.kycId] ?? "idle";
          const effectiveApproval =
            entry.kycId in approvalOverrides ? approvalOverrides[entry.kycId] : entry.isApproved;
          const effectiveWaived = entry.kycId in waiveOverrides ? waiveOverrides[entry.kycId] : entry.isWaived ?? false;
          const statusLabel = resolveStatusLabel(effectiveApproval);
          const rowTitle = resolveDecisionLabel(entry, title);
          const visibleMetadata = (metadataFields ?? [])
            .map((field) => ({
              field,
              value: field.value(entry)
            }))
            .filter(({ value }) => {
              if (typeof value !== "string") {
                return false;
              }
              return value.trim().length > 0;
            });

          return (
            <section key={entry.kycId} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{sectionLabel}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{rowTitle}</h3>
                  <p className="text-sm text-slate-500">Submitted: {formatDate(entry.createdAt)}</p>
                </div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Status: {statusLabel}</div>
              </div>

              {visibleMetadata.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {visibleMetadata.map(({ field, value }) => (
                    <DetailRow key={field.label} label={field.label} value={value} />
                  ))}
                </div>
              )}

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
                        {imageState.urls.map((url, index) => {
                          const alt = `${rowTitle} ${index + 1}`;
                          return (
                            <button
                              key={`${entry.kycId}-photo-${index}`}
                              type="button"
                              onClick={() => setViewerImage({ url, alt })}
                              className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-left"
                            >
                              <Image
                                src={url}
                                alt={alt}
                                width={320}
                                height={240}
                                unoptimized
                                className="h-44 w-full object-cover"
                                onError={(event) => {
                                  console.warn(`${contextLabel} image tag failed to load.`, {
                                    borrowerId,
                                    kycId: entry.kycId,
                                    index,
                                    url,
                                    message: event.currentTarget?.currentSrc ?? "unknown-src"
                                  });
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                        No images attached for this entry.
                      </div>
                    )}
                  </>
                )}
              </div>

              <BorrowerKycDecisionSection
                actionState={actionState}
                actionMessage={actionMessages[entry.kycId]}
                isWaived={effectiveWaived}
                onDecision={(action) => submitDecision(entry, action)}
              />
            </section>
          );
        })}
      </div>

      {viewerImage && (
        <BorrowerKycImageViewer
          imageUrl={viewerImage.url}
          alt={viewerImage.alt}
          onClose={() => setViewerImage(null)}
        />
      )}
    </>
  );
}
