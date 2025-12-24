import Sidebar from "@/components/navigation/Sidebar";
import QueueSection from "@/components/dashboard/QueueSection";
import { getDashboardData } from "@/shared/services/dashboardService";
import type { QueueRow } from "@/shared/types/dashboard";

type QueueViewDefinition = {
  id: string;
  title: string;
  description: string;
  badgeLabel: string;
  emptyMessage: string;
  filter: (row: QueueRow) => boolean;
};

const queueDefinitions: QueueViewDefinition[] = [
  {
    id: "kyc-submitted",
    title: "KYC: Submitted → Needs Verification",
    description: "Borrowers who already submitted documents but still need verification.",
    badgeLabel: "KYC queue",
    emptyMessage: "No borrowers are waiting on verification right now.",
    filter: (row) => row.status.toLowerCase().includes("submitted")
  },
  {
    id: "kyc-verified",
    title: "KYC: Verified → Needs Approval",
    description: "Verified records pending managerial approval before publishing.",
    badgeLabel: "KYC queue",
    emptyMessage: "Approval queue is clear for now.",
    filter: (row) =>
      row.status.toLowerCase().includes("approval") || row.tag.toLowerCase().includes("pending approval")
  },
  {
    id: "kyc-missing",
    title: "KYC: Missing Documents",
    description: "Missing mandatory Phase 1 KYC artifacts (IDs, selfie, signature, address).",
    badgeLabel: "KYC queue",
    emptyMessage: "All borrowers have the required Phase 1 documents.",
    filter: (row) => row.tag.toLowerCase().includes("missing")
  },
  {
    id: "kyc-expiry",
    title: "KYC: ID Expiring Soon",
    description: "IDs expiring within 30/60 days require follow-up reminders.",
    badgeLabel: "KYC queue",
    emptyMessage: "No urgent ID renewals in this window.",
    filter: (row) => row.tag.toLowerCase().includes("expiring") || row.reason.toLowerCase().includes("expire")
  },
  {
    id: "location-update",
    title: "Location: Needs Update",
    description: "Borrowers without fresh location observations in the last 10+ days.",
    badgeLabel: "Location queue",
    emptyMessage: "Every borrower has a recent location observation.",
    filter: (row) => row.tag.toLowerCase().includes("needs update")
  },
  {
    id: "location-low-confidence",
    title: "Location: Low Confidence",
    description: "Borrowers with low confidence scores driving branch-level follow-up.",
    badgeLabel: "Location queue",
    emptyMessage: "No low-confidence locations at the moment.",
    filter: (row) => row.tag.toLowerCase().includes("low confidence")
  }
];

export default async function QueuesPage() {
  const dashboardData = await getDashboardData();
  const heroStats = [
    {
      label: "KYC Pending Review",
      value: dashboardData.metrics.kycPendingReview,
      subtitle: "Submitted → verification"
    },
    {
      label: "KYC Pending Approval",
      value: dashboardData.metrics.kycPendingApproval,
      subtitle: "Awaiting managerial sign-off"
    },
    {
      label: "Location Needs Update",
      value: dashboardData.metrics.locationNeedsUpdate,
      subtitle: "No observation in 10+ days"
    },
    {
      label: "Low Confidence Locations",
      value: dashboardData.metrics.lowConfidenceLocations,
      subtitle: "Confidence below 0.6"
    }
  ];

  const queueViews = queueDefinitions.map((definition) => ({
    ...definition,
    items: dashboardData.queue.filter(definition.filter)
  }));

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <Sidebar />
      <div className="mx-auto w-full max-w-8xl">
        <main className="space-y-6 pl-72">
          <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
            <p className="text-xs uppercase tracking-[0.6em] text-slate-400">Operational Control</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Queues</h1>
            <p className="text-sm text-slate-600">
              Saved filters surface the borrowers who need attention for KYC or location quality. Use these queues as
              your front door for prioritizing Phase 1 compliance work.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.subtitle}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            {queueViews.map((view) => (
              <QueueSection
                key={view.id}
                title={view.title}
                description={view.description}
                badgeLabel={view.badgeLabel}
                items={view.items}
                emptyMessage={view.emptyMessage}
              />
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
