import type { Query } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoUsers } from "@/shared/data/demoUsers";
import { demoBranches } from "@/shared/data/demoBranches";
import type { SettingsStats } from "@/shared/types/settings";

async function getQueryCount(query: Query): Promise<number> {
  const queryWithCount = query as Query & { count?: () => { get: () => Promise<{ data: () => { count?: number } }> } };

  if (typeof queryWithCount.count === "function") {
    const aggregateSnapshot = await queryWithCount.count().get();
    const aggregateData = aggregateSnapshot.data();
    if (typeof aggregateData.count === "number") {
      return aggregateData.count;
    }
  }

  const snapshot = await query.get();
  return snapshot.size;
}

async function fetchSettingsStatsFromFirestore(): Promise<SettingsStats> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const activeUsersQuery = db.collection("users").where("status", "==", "active");
  const activeBranchesQuery = db.collection("branches").where("status", "==", "active");

  const [activeStaffCount, activeBranchCount] = await Promise.all([
    getQueryCount(activeUsersQuery),
    getQueryCount(activeBranchesQuery)
  ]);

  return {
    activeStaffCount,
    activeBranchCount,
    source: "firestore"
  };
}

export async function getSettingsStats(): Promise<SettingsStats> {
  if (hasAdminCredentials()) {
    try {
      return await fetchSettingsStatsFromFirestore();
    } catch (error) {
      console.warn("Unable to fetch settings stats from Firestore:", error);
    }
  }

  return {
    activeStaffCount: demoUsers.filter((user) => user.status === "active").length,
    activeBranchCount: demoBranches.filter((branch) => branch.status === "active").length,
    source: "demo"
  };
}
