import Sidebar from "@/components/navigation/Sidebar";
import BranchDirectory from "@/components/branches/BranchDirectory";
import QueueSection from "@/components/dashboard/QueueSection";
import { demoDashboardData } from "@/shared/data/demoDashboard";
import { getBranchSummaries } from "@/shared/services/branchService";
import { requireStaffSession } from "@/shared/services/sessionService";

export default async function BranchesPage() {
  await requireStaffSession();
  const branches = await getBranchSummaries(15);
  const kycQueue = demoDashboardData.queue.filter((item) => item.tag.startsWith("KYC"));
  const locationQueue = demoDashboardData.queue.filter((item) => item.tag.includes("Location"));

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <Sidebar />
      <div className="mx-auto w-full max-w-8xl">
        <main className="space-y-6 pl-72">
          {/* <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
            <p className="text-xs uppercase tracking-[0.6em] text-slate-400">Operational Control</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Branches</h1>
            <p className="text-sm text-slate-600">
              Map every branch to borrower identity so access is consistent company-wide. Use location confidence and KYC
              health to triage staffing or audit requests without guessing which branch owns the borrower record.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                Branch status follows Firestore data (status, address, geo). Denormalized KYC + location stats keep queues fast.
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                Compliance is branch-aware: staff can only see borrower data if their branch is linked, yet borrower identity stays shared.
              </div>
            </div>
          </section> */}

          <BranchDirectory branches={branches} />
{/* 
          <section className="grid gap-5 lg:grid-cols-2">
            <QueueSection title="Branch KYC queues" items={kycQueue} badgeLabel="Preview" />
            <QueueSection title="Branch location queues" items={locationQueue} badgeLabel="Preview" />
          </section> */}
        </main>
      </div>
    </div>
  );
}
