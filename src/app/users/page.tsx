// src/app/users/page.tsx
import Sidebar from "@/components/navigation/Sidebar";
import QueueSection from "@/components/dashboard/QueueSection";
import UserDirectory from "@/components/users/UserDirectory";
import { demoDashboardData } from "@/shared/data/demoDashboard";
import { getBranchSummaries } from "@/shared/services/branchService";
import { getUserSummaries } from "@/shared/services/userService";

export default async function UsersPage() {
  const users = await getUserSummaries(40);
  const branches = await getBranchSummaries(60);
  const kycQueue = demoDashboardData.queue.filter((item) => item.tag.startsWith("KYC"));
  const locationQueue = demoDashboardData.queue.filter((item) => item.tag.includes("Location"));

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <Sidebar />
      <div className="mx-auto w-full max-w-8xl">
        <main className="space-y-6 pl-72">
          {/* <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
            <p className="text-xs uppercase tracking-[0.6em] text-slate-400">Operational Control</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Users &amp; Roles</h1>
            <p className="text-sm text-slate-600">
              Role-based access, branch affinity, and audit coverage keep the CMS secure. Every action follows the Goizzi feedback
              contract (Idle ƒ+' Working ƒ+' Success ƒ+' Failure) before progressing.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                Staff access originates in Firebase Auth but mirrors Firestore `/users`. Keep role, branch, and permissions synced.
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                This screen avoids quick actions and instead surfaces who can view/edit KYC, upload documents, and approve changes.
              </div>
            </div>
          </section> */}

          <UserDirectory users={users} branches={branches} />

          {/* <section className="grid gap-5 lg:grid-cols-2">
            <QueueSection title="Governance queues" items={kycQueue} />
            <QueueSection title="Location &amp; monitoring" items={locationQueue} />
          </section> */}
        </main>
      </div>
    </div>
  );
}
