"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function BorrowerProfileRefreshButton() {
  const router = useRouter();
  const [isRefreshing, startRefreshing] = useTransition();

  const handleRefresh = () => {
    startRefreshing(() => {
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center justify-center self-start rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
        isRefreshing
          ? "cursor-not-allowed border-slate-200 text-slate-300"
          : "cursor-pointer border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
      <span className="sr-only">Refresh borrower profile data</span>
    </button>
  );
}
