import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoUsers } from "@/shared/data/demoUsers";
import type { UserRole, UserStatus, UserSummary } from "@/shared/types/user";

function normalizeDisplayName(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
}

function normalizeRole(role: unknown): UserRole {
  const validRoles: UserRole[] = ["admin", "team", "manager", "auditor"];
  return typeof role === "string" && validRoles.includes(role as UserRole) ? (role as UserRole) : "team";
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
  const displayName = normalizeDisplayName(data.displayName);

  return {
    userId: doc.id,
    displayName: displayName ?? "Unknown staff",
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

export async function getUserDisplayNamesByIds(userIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(userIds.filter((userId) => typeof userId === "string" && userId.trim().length)));
  if (!uniqueIds.length) {
    return {};
  }

  if (hasAdminCredentials()) {
    const firestore = db;
    if (!firestore) {
      return {};
    }

    try {
      const refs = uniqueIds.map((userId) => firestore.collection("users").doc(userId));
      const snapshots = await firestore.getAll(...refs);
      const result: Record<string, string> = {};

      snapshots.forEach((doc, index) => {
        if (!doc.exists) {
          return;
        }
        const displayName = normalizeDisplayName(doc.data()?.displayName);
        if (displayName) {
          result[uniqueIds[index]] = displayName;
        }
      });

      return result;
    } catch (error) {
      console.warn("Unable to fetch user names from Firestore:", error);
    }
  }

  const result: Record<string, string> = {};
  const demoLookup = new Map(demoUsers.map((user) => [user.userId, user.displayName]));
  uniqueIds.forEach((userId) => {
    const displayName = demoLookup.get(userId);
    if (displayName) {
      result[userId] = displayName;
    }
  });
  return result;
}

export async function getUserDisplayNameById(userId?: string): Promise<string | undefined> {
  if (!userId) {
    return undefined;
  }
  const names = await getUserDisplayNamesByIds([userId]);
  return names[userId];
}
