"use client";

export default function PrintControls() {
  return (
    <div className="print:hidden mb-6 flex justify-end">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 hover:border-slate-700 hover:text-slate-700"
      >
        Print
      </button>
    </div>
  );
}
