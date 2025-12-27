import type { UserSummary } from "@/shared/types/user";

export const demoUsers: UserSummary[] = [
  {
    userId: "user-admin-001",
    displayName: "Maria Santos",
    email: "maria.santos@goizzi.com",
    phone: "+63 917 555 0011",
    role: "admin",
    branchId: "branch-makati",
    branchName: "Branch A - Makati",
    status: "active",
    createdAt: "2025-06-12",
    lastActiveAt: "2025-12-20",
    permissions: ["KYC:read", "KYC:approve", "Location:edit", "Users:manage"]
  },
  {
    userId: "user-team-002",
    displayName: "Jorge de Vera",
    email: "jorge.devera@goizzi.com",
    role: "team",
    branchId: "branch-cebu",
    branchName: "Branch B - Cebu",
    status: "active",
    createdAt: "2025-08-01",
    lastActiveAt: "2025-12-19",
    permissions: ["KYC:submit", "Location:submit"]
  },
  {
    userId: "user-manager-003",
    displayName: "Leah Del Rosario",
    email: "leah.delrosario@goizzi.com",
    phone: "+63 918 332 2211",
    role: "manager",
    branchId: "branch-davao",
    branchName: "Branch C - Davao",
    status: "active",
    createdAt: "2024-11-03",
    lastActiveAt: "2025-12-21",
    permissions: ["KYC:approve", "Location:review", "Borrower:read"]
  },
  {
    userId: "user-auditor-004",
    displayName: "Tomas Aquino",
    email: "tomas.aquino@goizzi.com",
    role: "auditor",
    branchName: "Company-wide",
    status: "inactive",
    createdAt: "2023-04-18",
    lastActiveAt: "2025-10-04",
    permissions: ["KYC:read", "Location:read", "Audit:review"]
  }
];
