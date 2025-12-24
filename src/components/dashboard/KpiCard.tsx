import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon?: ReactNode;
  variant?: "north" | "neutral";
}

export default function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{title}</p>
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-[#1877f2] to-[#4c89ff]" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
