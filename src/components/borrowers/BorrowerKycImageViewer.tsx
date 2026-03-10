"use client";

import { useCallback, useEffect, useMemo, useState, type WheelEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";

interface BorrowerKycImageViewerProps {
  images: Array<{ url: string; alt: string; path?: string }>;
  initialIndex: number;
  rotationByUrl?: Record<string, number>;
  onRotate?: (imageUrl: string, rotationDeg: number, storagePath?: string) => void;
  onClose: () => void;
}

export default function BorrowerKycImageViewer({
  images,
  initialIndex,
  rotationByUrl,
  onRotate,
  onClose
}: BorrowerKycImageViewerProps) {
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.25;
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const safeIndex = Math.min(Math.max(activeIndex, 0), images.length - 1);
  const activeImage = images[safeIndex];
  const canGoPrevious = safeIndex > 0;
  const canGoNext = safeIndex < images.length - 1;
  const rotationDeg = activeImage ? rotationByUrl?.[activeImage.url] ?? 0 : 0;

  const zoomPercent = useMemo(() => `${Math.round(zoomLevel * 100)}%`, [zoomLevel]);

  const applyZoom = (next: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(next.toFixed(2))));
    setZoomLevel(clamped);
  };

  const handleWheelZoom = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    applyZoom(zoomLevel + delta);
  };

  const goToPrevious = useCallback(() => {
    if (!canGoPrevious) {
      return;
    }
    setActiveIndex((current) => current - 1);
    setZoomLevel(1);
  }, [canGoPrevious]);

  const goToNext = useCallback(() => {
    if (!canGoNext) {
      return;
    }
    setActiveIndex((current) => current + 1);
    setZoomLevel(1);
  }, [canGoNext]);

  const handleRotate = () => {
    if (!activeImage) {
      return;
    }
    const nextRotation = (rotationDeg - 90 + 360) % 360;
    onRotate?.(activeImage.url, nextRotation, activeImage.path);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, onClose]);

  if (!activeImage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <button
        type="button"
        aria-label="Close image viewer"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
      />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Image preview</p>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={!canGoPrevious}
                title="Previous image"
                aria-label="Previous image"
                className="cursor-pointer rounded-full p-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-16 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {safeIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={goToNext}
                disabled={!canGoNext}
                title="Next image"
                aria-label="Next image"
                className="cursor-pointer rounded-full p-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
              <button
                type="button"
                onClick={() => applyZoom(zoomLevel - ZOOM_STEP)}
                disabled={zoomLevel <= MIN_ZOOM}
                title="Zoom out"
                aria-label="Zoom out image"
                className="cursor-pointer rounded-full p-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-14 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {zoomPercent}
              </span>
              <button
                type="button"
                onClick={() => applyZoom(zoomLevel + ZOOM_STEP)}
                disabled={zoomLevel >= MAX_ZOOM}
                title="Zoom in"
                aria-label="Zoom in image"
                className="cursor-pointer rounded-full p-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate image"
                aria-label="Rotate image"
                className="cursor-pointer rounded-full p-1 text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 hover:border-slate-300 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
        <div
          className="overflow-auto bg-slate-950"
          onWheel={handleWheelZoom}
          title="Use mouse wheel to zoom"
        >
          <Image
            src={activeImage.url}
            alt={activeImage.alt}
            width={1600}
            height={1200}
            unoptimized
            className="mx-auto max-h-[80vh] w-full object-contain"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotationDeg}deg)`,
              transformOrigin: "center center",
              transition: "transform 120ms ease-out"
            }}
          />
        </div>
      </div>
    </div>
  );
}
