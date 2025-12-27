"use client";

import Image from "next/image";

interface BorrowerKycImageViewerProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export default function BorrowerKycImageViewer({ imageUrl, alt, onClose }: BorrowerKycImageViewerProps) {
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
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 hover:border-slate-300 hover:text-slate-800"
          >
            Close
          </button>
        </div>
        <div className="bg-slate-950">
          <Image
            src={imageUrl}
            alt={alt}
            width={1600}
            height={1200}
            unoptimized
            className="max-h-[80vh] w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
