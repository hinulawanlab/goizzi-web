import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoBranches } from "@/shared/data/demoBranches";
import type { BranchSummary, BranchStatus } from "@/shared/types/branch";

function normalizeStatus(status: unknown): BranchStatus {
  if (status === "inactive") {
    return "inactive";
  }

  return "active";
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    !!value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

function buildUpdatedDate(data: Record<string, unknown>): string {
  const timestamp = data.updatedAt ?? data.createdAt;
  if (isTimestampLike(timestamp)) {
    return timestamp.toDate().toISOString().split("T")[0];
  }

  if (typeof timestamp === "string") {
    return timestamp;
  }

  return "N/A";
}

function mapBranchDoc(doc: DocumentSnapshot): BranchSummary {
  const data = doc.data() || {};

  const geoPoint = data.geo ?? data.location;
  let geo;
  if (geoPoint instanceof Object && typeof geoPoint.latitude === "number" && typeof geoPoint.longitude === "number") {
    geo = { lat: geoPoint.latitude, lng: geoPoint.longitude };
  } else if (geoPoint instanceof Object && typeof geoPoint.lat === "number" && typeof geoPoint.lng === "number") {
    geo = { lat: geoPoint.lat, lng: geoPoint.lng };
  }

  return {
    branchId: doc.id,
    name: data.name || doc.id,
    status: normalizeStatus(data.status),
    region: data.region || "Unassigned region",
    address: data.address || data.locationDescription || "Address not available",
    borrowerCount: typeof data.borrowerCount === "number" ? data.borrowerCount : 0,
    activeLoans: typeof data.activeLoanCount === "number" ? data.activeLoanCount : 0,
    activeLoanCount: typeof data.activeLoanCount === "number" ? data.activeLoanCount : 0,
    kycPending: typeof data.kycPending === "number" ? data.kycPending : 0,
    locationAlerts: typeof data.locationAlerts === "number" ? data.locationAlerts : 0,
    lastUpdated: buildUpdatedDate(data),
    geo
  };
}

async function fetchBranchesFromFirestore(limit = 20): Promise<BranchSummary[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db.collection("branches").orderBy("name").limit(limit).get();
  if (snapshot.empty) {
    throw new Error("No branch documents found.");
  }

  return snapshot.docs.map(mapBranchDoc);
}

export async function getBranchSummaries(limit = 20): Promise<BranchSummary[]> {
  if (hasAdminCredentials()) {
    try {
      return await fetchBranchesFromFirestore(limit);
    } catch (error) {
      console.warn("Unable to fetch branches from Firestore:", error);
    }
  }

  return demoBranches;
}
