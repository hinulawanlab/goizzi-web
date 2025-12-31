import type { BranchSummary } from "@/shared/types/branch";

const statusBadgeClass: Record<BranchSummary["status"], string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500"
};

interface BranchDirectoryProps {
  branches: BranchSummary[];
}

export default function BranchDirectory({ branches }: BranchDirectoryProps) {
  const totalBorrowers = branches.reduce((sum, branch) => sum + branch.borrowerCount, 0);
  const totalLoans = branches.reduce((sum, branch) => sum + branch.activeLoans, 0);
  const pendingKyc = branches.reduce((sum, branch) => sum + branch.kycPending, 0);
  const locationAlerts = branches.reduce((sum, branch) => sum + branch.locationAlerts, 0);
  const activeBranches = branches.filter((branch) => branch.status === "active").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Branches</p>
            <h2 className="text-2xl font-semibold text-slate-900">Branch oversight</h2>
            <p className="text-sm text-slate-500">
              See branch health, KYC queues, and location confidence per hub so you can staff and audit confidently.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <p className="font-semibold text-slate-900">
              {activeBranches} active branch{activeBranches === 1 ? "" : "es"} · {branches.length} total listed
            </p>
            {/* <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Queues are Branch-specific</p> */}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Borrowers</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalBorrowers.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Active across tracked branches</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active loans</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalLoans.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Updated nightly after postings</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">KYC pending</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingKyc}</p>
            <p className="text-xs text-slate-500">Submitted but not verified</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Location alerts</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{locationAlerts}</p>
            <p className="text-xs text-slate-500">Low confidence or stale observations</p>
          </div>
        </div>
      </section>

      {branches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">No branches configured yet.</p>
          <p className="mt-2 text-xs text-slate-500">Add a branch in Firebase to see it listed here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-175px text-left text-sm text-slate-600">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  <th className="px-3 py-3">Branch</th>
                  <th className="px-3 py-3">Region</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Borrowers</th>
                  <th className="px-3 py-3">Active loans</th>
                  <th className="px-3 py-3">KYC pending</th>
                  <th className="px-3 py-3">Location alerts</th>
                  <th className="px-3 py-3">Last sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map((branch) => (
                  <tr key={branch.branchId} className="hover:bg-slate-50">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-900">{branch.name}</p>
                      <p className="text-xs text-slate-500">{branch.address}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-700">{branch.region}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusBadgeClass[branch.status]}`}>
                        {branch.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">{branch.borrowerCount.toLocaleString()}</td>
                    <td className="px-3 py-4">{branch.activeLoans.toLocaleString()}</td>
                    <td className="px-3 py-4">{branch.kycPending}</td>
                    <td className="px-3 py-4">{branch.locationAlerts}</td>
                    <td className="px-3 py-4">{branch.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
