export type UserRole = "admin" | "team lead" | "team member" | "auditor";
export type UserStatus = "active" | "inactive" | "suspend";

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
