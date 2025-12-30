// src/components/borrowers/LoanStatusBadge.tsx
"use client";

interface LoanStatusBadgeProps {
  status?: string;
  className?: string;
}

function getStatusClass(status: string) {
  const normalized = status.trim().toLowerCase();
  switch (normalized) {
    case "submitted":
      return "bg-amber-100 text-amber-700";
    case "approve":
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "delinquent":
    case "pastdue":
      return "bg-rose-100 text-rose-700";
    case "reviewed":
      return "bg-sky-100 text-sky-700";
    case "completed":
      return "bg-slate-200 text-slate-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    case "reject":
    case "rejected":
      return "bg-rose-100 text-rose-700";
    case "draft":
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function LoanStatusBadge({ status, className = "" }: LoanStatusBadgeProps) {
  const displayStatus = status?.trim() ? status : "N/A";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStatusClass(
        displayStatus
      )} ${className}`.trim()}
    >
      {displayStatus}
    </span>
  );
}
