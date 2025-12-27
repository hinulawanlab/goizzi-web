export type UserRole = "admin" | "team" | "manager" | "auditor";
export type UserStatus = "active" | "inactive";

export interface UserSummary {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  branchId?: string;
  branchName: string;
  status: UserStatus;
  createdAt: string;
  lastActiveAt: string;
  permissions: string[];
}
