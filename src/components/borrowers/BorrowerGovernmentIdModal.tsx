"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { fetchSignedKycImageUrls, type KycSignedImageItem } from "@/shared/services/kycImageService";
import type { BorrowerGovernmentIdKyc } from "@/shared/types/kyc";

type LoadState = "idle" | "loading" | "success" | "error";
type ActionState = "idle" | "working" | "success" | "error";
type PrintState = "idle" | "working" | "error";
type PrintSide = "front" | "back";

interface BorrowerGovernmentIdModalProps {
  kycs: BorrowerGovernmentIdKyc[];
  borrowerName?: string;
}

interface PrintFocus {
  zoom: number;
  x: number;
  y: number;
}

interface DragState {
  side: PrintSide;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

const DEFAULT_PRINT_FOCUS: PrintFocus = {
  zoom: 1.9,
  x: 0,
  y: 18
};
const MAX_OFFSET_PERCENT = 45;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;

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

function buildTransformStyle(focus: PrintFocus) {
  return {
    transform: `translate(${focus.x}%, ${focus.y}%) scale(${focus.zoom})`,
    transformOrigin: "center center"
  };
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
  const [printState, setPrintState] = useState<PrintState>("idle");
  const [printMessage, setPrintMessage] = useState<string | null>(null);
  const [printSelections, setPrintSelections] = useState<Record<PrintSide, boolean>>({
    front: false,
    back: false
  });
  const [printFocus, setPrintFocus] = useState<Record<PrintSide, PrintFocus>>({
    front: { ...DEFAULT_PRINT_FOCUS },
    back: { ...DEFAULT_PRINT_FOCUS }
  });
  const [dragState, setDragState] = useState<DragState | null>(null);

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
    setPrintState("idle");
    setPrintMessage(null);
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
    const handleAfterPrint = () => {
      document.body.classList.remove("gov-id-print-mode");
      setPrintState("idle");
      setPrintMessage(null);
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("gov-id-print-mode");
    };
  }, []);

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
    setPrintState("idle");
    setPrintMessage(null);

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
        setPrintSelections({
          front: Boolean(resolvedFront),
          back: Boolean(resolvedBack)
        });
        setPrintFocus({
          front: { ...DEFAULT_PRINT_FOCUS },
          back: { ...DEFAULT_PRINT_FOCUS }
        });
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
  const hasSelectedForPrint =
    (printSelections.front && Boolean(frontUrl)) || (printSelections.back && Boolean(backUrl));

  const updateDragPosition = (side: PrintSide, deltaXPercent: number, deltaYPercent: number) => {
    setPrintFocus((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        x: Math.max(-MAX_OFFSET_PERCENT, Math.min(MAX_OFFSET_PERCENT, prev[side].x + deltaXPercent)),
        y: Math.max(-MAX_OFFSET_PERCENT, Math.min(MAX_OFFSET_PERCENT, prev[side].y + deltaYPercent))
      }
    }));
  };

  const handlePrintIdOnly = () => {
    if (!hasSelectedForPrint || loadState !== "success") {
      return;
    }
    setPrintState("working");
    setPrintMessage("Preparing print...");
    document.body.classList.add("gov-id-print-mode");
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const updateZoom = (side: PrintSide, direction: "in" | "out") => {
    setPrintFocus((prev) => {
      const current = prev[side].zoom;
      const next = direction === "in" ? current + ZOOM_STEP : current - ZOOM_STEP;
      return {
        ...prev,
        [side]: {
          ...prev[side],
          zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(next.toFixed(2))))
        }
      };
    });
  };

  const resetFocus = (side: PrintSide) => {
    setPrintFocus((prev) => ({
      ...prev,
      [side]: { ...DEFAULT_PRINT_FOCUS }
    }));
  };

  const handleWheelZoom = (side: PrintSide, event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const direction: "in" | "out" = event.deltaY < 0 ? "in" : "out";
    updateZoom(side, direction);
  };

  const startDragging = (side: PrintSide, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const focus = printFocus[side];
    setDragState({
      side,
      startX: event.clientX,
      startY: event.clientY,
      originX: focus.x,
      originY: focus.y
    });
  };

  const moveDragging = (side: PrintSide, event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.side !== side) {
      return;
    }
    const container = event.currentTarget.getBoundingClientRect();
    if (!container.width || !container.height) {
      return;
    }
    const deltaXPercent = ((event.clientX - dragState.startX) / container.width) * 100;
    const deltaYPercent = ((event.clientY - dragState.startY) / container.height) * 100;
    setPrintFocus((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        x: Math.max(-MAX_OFFSET_PERCENT, Math.min(MAX_OFFSET_PERCENT, dragState.originX + deltaXPercent)),
        y: Math.max(-MAX_OFFSET_PERCENT, Math.min(MAX_OFFSET_PERCENT, dragState.originY + deltaYPercent))
      }
    }));
  };

  const endDragging = () => {
    setDragState(null);
  };

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
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-8">
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 cursor-default bg-slate-900/60"
            aria-label="Close ID card viewer"
          />
          <div className="relative mx-auto w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Government ID</p>
                <h3 className="text-xl font-semibold text-slate-900">Borrower identification cards</h3>
                <p className="text-sm text-slate-500">
                  {borrowerName ? `${borrowerName} - ` : ""}ID type: {currentKyc?.idType ?? "Unknown"}
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
                <button
                  type="button"
                  onClick={handlePrintIdOnly}
                  disabled={!hasSelectedForPrint || printState === "working"}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    !hasSelectedForPrint || printState === "working"
                      ? "cursor-not-allowed border-slate-200 text-slate-300"
                      : "cursor-pointer border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  }`}
                >
                  {printState === "working" ? "Preparing print..." : "Print Selected ID"}
                </button>
              </div>
            </div>

            <div className="mt-6 max-h-[calc(100vh-10rem)] space-y-6 overflow-y-auto pr-1">
              {printMessage && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{printMessage}</div>
              )}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                Drag the image inside each frame to position the ID for print.
              </div>

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
                  {([
                    { side: "front" as PrintSide, label: "Front", url: frontUrl },
                    { side: "back" as PrintSide, label: "Back", url: backUrl }
                  ] as const).map(({ side, label, url }) => (
                    <div key={side} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs">
                            <button
                              type="button"
                              onClick={() => updateZoom(side, "out")}
                              disabled={!url || printFocus[side].zoom <= MIN_ZOOM}
                              className="h-6 w-6 rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
                              title="Zoom out"
                              aria-label={`Zoom out ${label}`}
                            >
                              -
                            </button>
                            <span className="min-w-52px text-center font-semibold text-slate-600">
                              {printFocus[side].zoom.toFixed(2)}x
                            </span>
                            <button
                              type="button"
                              onClick={() => updateZoom(side, "in")}
                              disabled={!url || printFocus[side].zoom >= MAX_ZOOM}
                              className="h-6 w-6 rounded-full border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:text-slate-300"
                              title="Zoom in"
                              aria-label={`Zoom in ${label}`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => resetFocus(side)}
                              disabled={!url}
                              className="ml-1 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 disabled:cursor-not-allowed disabled:text-slate-300"
                              title="Reset position"
                              aria-label={`Reset ${label} position`}
                            >
                              Reset
                            </button>
                          </div>
                          <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300"
                              checked={printSelections[side] && Boolean(url)}
                              disabled={!url}
                              onChange={(event) =>
                                setPrintSelections((prev) => ({
                                  ...prev,
                                  [side]: event.target.checked
                                }))
                              }
                            />
                            Include in print
                          </label>
                        </div>
                      </div>

                      {url ? (
                        <>
                          <div className="relative mt-3 aspect-[1.58/1] overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div
                              className={`absolute inset-0 ${dragState?.side === side ? "cursor-grabbing" : "cursor-grab"}`}
                              onPointerDown={(event) => startDragging(side, event)}
                              onPointerMove={(event) => moveDragging(side, event)}
                              onPointerUp={endDragging}
                              onPointerCancel={endDragging}
                              onPointerLeave={endDragging}
                              onWheel={(event) => handleWheelZoom(side, event)}
                            >
                              <Image
                                src={url}
                                alt={`Government ID ${label.toLowerCase()}`}
                                fill
                                unoptimized
                                className="object-cover"
                                style={buildTransformStyle(printFocus[side])}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">{label} image unavailable.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="gov-id-print-root hidden print:block">
          <header className="gov-id-print-header">
            <h1>Government ID</h1>
            <p>{borrowerName ?? "Borrower"}</p>
          </header>
          <section className="gov-id-print-grid">
            {printSelections.front && frontUrl && (
              <figure className="gov-id-print-item">
                <div className="gov-id-print-image-frame">
                  <Image
                    src={frontUrl}
                    alt="Government ID front for print"
                    fill
                    unoptimized
                    className="object-cover"
                    style={buildTransformStyle(printFocus.front)}
                  />
                </div>
                <figcaption>Front</figcaption>
              </figure>
            )}
            {printSelections.back && backUrl && (
              <figure className="gov-id-print-item">
                <div className="gov-id-print-image-frame">
                  <Image
                    src={backUrl}
                    alt="Government ID back for print"
                    fill
                    unoptimized
                    className="object-cover"
                    style={buildTransformStyle(printFocus.back)}
                  />
                </div>
                <figcaption>Back</figcaption>
              </figure>
            )}
          </section>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body.gov-id-print-mode * {
            visibility: hidden !important;
          }

          body.gov-id-print-mode .gov-id-print-root,
          body.gov-id-print-mode .gov-id-print-root * {
            visibility: visible !important;
          }

          body.gov-id-print-mode .gov-id-print-root {
            position: absolute !important;
            inset: 0 !important;
            background: #fff !important;
            padding: 0.4in !important;
          }

          body.gov-id-print-mode .gov-id-print-header h1 {
            margin: 0 !important;
            font-size: 16px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            color: #0f172a !important;
          }

          body.gov-id-print-mode .gov-id-print-header p {
            margin: 2px 0 0 0 !important;
            font-size: 11px !important;
            color: #475569 !important;
          }

          body.gov-id-print-mode .gov-id-print-grid {
            margin-top: 0.2in !important;
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 0.18in !important;
          }

          body.gov-id-print-mode .gov-id-print-item {
            margin: 0 !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 8px !important;
            break-inside: avoid-page !important;
          }

          body.gov-id-print-mode .gov-id-print-image-frame {
            position: relative !important;
            width: 100% !important;
            aspect-ratio: 1.58 / 1 !important;
            overflow: hidden !important;
            border-radius: 6px !important;
            border: 1px solid #e2e8f0 !important;
          }

          body.gov-id-print-mode .gov-id-print-item figcaption {
            margin-top: 6px !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.12em !important;
            color: #64748b !important;
          }

          @page {
            size: 8.5in 13in;
            margin: 0.3in;
          }
        }
      `}</style>
    </>
  );
}
