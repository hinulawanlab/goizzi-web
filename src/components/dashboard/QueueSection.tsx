import type { QueueRow } from "@/shared/types/dashboard";

interface QueueSectionProps {
  title: string;
  items: QueueRow[];
  description?: string;
  badgeLabel?: string;
  emptyMessage?: string;
}

export default function QueueSection({
  title,
  items,
  description,
  badgeLabel,
  emptyMessage
}: QueueSectionProps) {
  const badgeText = badgeLabel ?? "Queue";
  const borrowerCount = `${items.length} borrower${items.length === 1 ? "" : "s"}`;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        <div className="flex flex-col items-end text-right text-[11px] uppercase tracking-[0.3em] text-slate-500">
          <span className="text-xs font-semibold text-slate-400">{badgeText}</span>
          <span className="text-[10px] text-slate-400">{borrowerCount}</span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center text-sm text-slate-500">
          {emptyMessage ?? "No borrowers in this queue yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.borrowerId}-${item.reason}`}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">{item.borrowerId}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1877f2]">
                  {item.tag}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{item.status}</span>
                <span>{item.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
