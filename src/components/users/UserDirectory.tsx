import type { UserRole, UserStatus, UserSummary } from "@/shared/types/user";

const roleBadgeClass: Record<UserRole, string> = {
  admin: "bg-amber-100 text-amber-700",
  manager: "bg-sky-100 text-sky-700",
  encoder: "bg-emerald-100 text-emerald-700",
  auditor: "bg-slate-100 text-slate-600"
};

const statusBadgeClass: Record<UserStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600"
};

const roleDisplayName: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  encoder: "Encoder",
  auditor: "Auditor"
};

interface UserDirectoryProps {
  users: UserSummary[];
}

export default function UserDirectory({ users }: UserDirectoryProps) {
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const inactiveUsers = totalUsers - activeUsers;
  const roleCounts: Record<UserRole, number> = {
    admin: 0,
    manager: 0,
    encoder: 0,
    auditor: 0
  };

  users.forEach((user) => {
    roleCounts[user.role] += 1;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Users & Roles</p>
            <h2 className="text-2xl font-semibold text-slate-900">Access governance</h2>
            <p className="text-sm text-slate-500">
              Role-based permissions, branch affinity, and audit trails are visible for every staff account, keeping compliance
              easy to spot before you grant more access.
            </p>
          </div>
          {/* <div className="text-sm text-slate-500">
            <p className="font-semibold text-slate-900">Actions follow the 4-state contract</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No quick edits from the list</p>
          </div> */}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total users</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalUsers}</p>
            <p className="text-xs text-slate-500">Across all branches</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{activeUsers}</p>
            <p className="text-xs text-slate-500">{inactiveUsers} inactive</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Role coverage</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {Object.values(roleCounts).reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0)} roles
            </p>
            <p className="text-xs text-slate-500">Assignments per team</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Last sync</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">Realtime</p>
            <p className="text-xs text-slate-500">Firestore identity + auth</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {(["admin", "manager", "encoder", "auditor"] as UserRole[]).map((role) => (
            <div key={role} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{roleDisplayName[role]}</span>
              <span className="text-sm font-semibold text-slate-900">{roleCounts[role]}</span>
            </div>
          ))}
        </div>
      </section>

      {totalUsers === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">No staff accounts yet.</p>
          <p className="mt-2 text-xs text-slate-500">Grant access through Firebase Auth or the Admin Console.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">User directory</p>
              <h3 className="text-lg font-semibold text-slate-900">Roles and access</h3>
            </div>
            {/* <span className="text-xs text-slate-500">Click a row to inspect permissions</span> */}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-225px text-left text-sm text-slate-600">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Branch</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Last active</th>
                  <th className="px-3 py-3">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.userId} className="hover:bg-slate-50">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-900">{user.displayName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${roleBadgeClass[user.role]}`}
                      >
                        {roleDisplayName[user.role]}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      <p>{user.branchName}</p>
                      {user.phone && <p className="text-[11px] text-slate-400">{user.phone}</p>}
                    </td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusBadgeClass[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">{user.lastActiveAt}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.slice(0, 3).map((permission) => (
                          <span key={permission} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                            {permission}
                          </span>
                        ))}
                        {user.permissions.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                            +{user.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">Created {user.createdAt}</p>
                    </td>
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
