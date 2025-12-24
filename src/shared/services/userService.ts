import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoUsers } from "@/shared/data/demoUsers";
import type { UserRole, UserStatus, UserSummary } from "@/shared/types/user";

function normalizeRole(role: unknown): UserRole {
  const validRoles: UserRole[] = ["admin", "encoder", "manager", "auditor"];
  return typeof role === "string" && validRoles.includes(role as UserRole) ? (role as UserRole) : "encoder";
}

function normalizeStatus(status: unknown): UserStatus {
  return status === "inactive" ? "inactive" : "active";
}

function formatDate(value: unknown): string {
  if (!value) {
    return "N/A";
  }

  const asAny = value as { toDate?: () => Date; toMillis?: () => number; _seconds?: number };
  if (typeof asAny.toDate === "function") {
    return asAny.toDate().toISOString().split("T")[0];
  }

  if (typeof asAny.toMillis === "function") {
    return new Date(asAny.toMillis()).toISOString().split("T")[0];
  }

  if (typeof asAny._seconds === "number") {
    return new Date(asAny._seconds * 1000).toISOString().split("T")[0];
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  return "N/A";
}

function mapUserDoc(doc: DocumentSnapshot): UserSummary {
  const data = doc.data() || {};
  const branchId = typeof data.branchId === "string" ? data.branchId : undefined;

  return {
    userId: doc.id,
    displayName: data.displayName || "Unknown staff",
    email: data.email || "unknown@goizzi.com",
    phone: data.phone,
    role: normalizeRole(data.role),
    branchId,
    branchName: typeof data.branchName === "string"
      ? data.branchName
      : branchId
        ? `Branch ${branchId}`
        : "Company-wide",
    status: normalizeStatus(data.status),
    createdAt: formatDate(data.createdAt),
    lastActiveAt: formatDate(data.lastActiveAt ?? data.updatedAt ?? data.createdAt),
    permissions: Array.isArray(data.permissions)
      ? data.permissions.filter((item): item is string => typeof item === "string")
      : []
  };
}

async function fetchUsersFromFirestore(limit = 30): Promise<UserSummary[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db.collection("users").orderBy("createdAt", "desc").limit(limit).get();
  if (snapshot.empty) {
    throw new Error("No user documents found.");
  }

  return snapshot.docs.map(mapUserDoc);
}

export async function getUserSummaries(limit = 30): Promise<UserSummary[]> {
  if (hasAdminCredentials()) {
    try {
      return await fetchUsersFromFirestore(limit);
    } catch (error) {
      console.warn("Unable to fetch user documents from Firestore:", error);
    }
  }

  return demoUsers;
}
