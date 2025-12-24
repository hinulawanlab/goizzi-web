import Sidebar from "@/components/navigation/Sidebar";
import KpiCard from "@/components/dashboard/KpiCard";
import BorrowerTable from "@/components/dashboard/BorrowerTable";
import QueueSection from "@/components/dashboard/QueueSection";
import { getDashboardData } from "@/shared/services/dashboardService";

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <Sidebar />
      <div className="mx-auto w-full max-w-8xl">
        <main className="space-y-6 pl-72">
          <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
            <p className="text-xs uppercase tracking-[0.6em] text-slate-400">Operational Control</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Borrower Management</h1>
            <p className="text-sm text-slate-600">
              Dashboard, queues, and borrower insights for KYC &amp; location quality.
            </p>
            <div className="mt-4 rounded-2xl bg-slate-900/5 px-4 py-3 text-sm text-slate-700">
              You have <strong className="text-[#1877f2]">{dashboardData.metrics.kycPendingReview}</strong> borrowers awaiting KYC
              verification and <strong className="text-[#1877f2]">{dashboardData.metrics.locationNeedsUpdate}</strong> borrowers with
              stale locations.
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <KpiCard title="KYC Pending Review" value={dashboardData.metrics.kycPendingReview} subtitle="Submitted but not verified" />
            <KpiCard title="KYC Pending Approval" value={dashboardData.metrics.kycPendingApproval} subtitle="Verified awaiting approval" />
            <KpiCard title="ID Expiring Soon" value={dashboardData.metrics.idsExpiring} subtitle="Due within 60 days" />
            <KpiCard title="Missing Docs" value={dashboardData.metrics.kycMissingDocs} subtitle="Required docs absent" />
            <KpiCard title="Location Needs Update" value={dashboardData.metrics.locationNeedsUpdate} subtitle="No observation in 10+ days" />
            <KpiCard title="Low Confidence" value={dashboardData.metrics.lowConfidenceLocations} subtitle="Confidence < 0.6" />
          </section>

          <section className="grid gap-5 lg:grid-cols-[3fr,2fr]">
            <BorrowerTable borrowers={dashboardData.borrowers} />
            <div className="space-y-5">
            <QueueSection
              title="Borrowers needing KYC action"
              items={dashboardData.queue.slice(0, 2)}
              badgeLabel="Preview"
            />
            <QueueSection
              title="Borrowers needing location updates"
              items={dashboardData.queue.slice(2)}
              badgeLabel="Preview"
            />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
