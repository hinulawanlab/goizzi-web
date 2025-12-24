import { FieldPath } from "firebase-admin/firestore";
import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoDashboardData } from "@/shared/data/demoDashboard";
import type { BorrowerSummary, FrequentArea, KycStatus, LocationQuality } from "@/shared/types/dashboard";

function normalizeStatus(status: unknown): KycStatus {
  const valid: KycStatus[] = ["draft", "submitted", "verified", "approved"];
  return typeof status === "string" && valid.includes(status as KycStatus) ? (status as KycStatus) : "draft";
}

function normalizeLocationQuality(quality: unknown): LocationQuality {
  const valid: LocationQuality[] = ["Good", "Needs Update", "Low Confidence"];
  return typeof quality === "string" && valid.includes(quality as LocationQuality) ? (quality as LocationQuality) : "Needs Update";
}

function formatTimestamp(value: unknown): string {
  if (!value) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return ((value as { toDate?: () => Date }).toDate as () => Date)().toISOString().split("T")[0];
  }

  const toMillisFn = (value as { toMillis?: () => number }).toMillis;
  if (typeof toMillisFn === "function") {
    return new Date(toMillisFn()).toISOString().split("T")[0];
  }

  const seconds = (value as { _seconds?: number })._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toISOString().split("T")[0];
  }

  return "N/A";
}

function normalizeFrequentAreas(locationSummary?: Record<string, unknown>): FrequentArea[] {
  if (!locationSummary) {
    return [];
  }

  let rawAreas: unknown[] = [];
  if (Array.isArray(locationSummary["topAreas"])) {
    rawAreas = locationSummary["topAreas"] as unknown[];
  } else if (Array.isArray(locationSummary["top3"])) {
    rawAreas = locationSummary["top3"] as unknown[];
  }

  return rawAreas.slice(0, 3).map((area) => {
    const entry = area as Record<string, unknown>;
    const confidence =
      typeof entry.confidenceScore === "number"
        ? entry.confidenceScore
        : typeof entry.confidence === "number"
          ? entry.confidence
          : 0;

    return {
      label: typeof entry.label === "string" ? entry.label : "Unknown area",
      confidence,
      lastSeen: formatTimestamp(entry.lastSeen)
    };
  });
}

function mapBorrowerDoc(doc: DocumentSnapshot): BorrowerSummary {
  const data = doc.data() || {};
  const primaryBranchId = typeof data.primaryBranchId === "string" ? data.primaryBranchId : undefined;
  const fallbackBranchId = typeof data.branchId === "string" ? data.branchId : undefined;
  const branchDocumentId = primaryBranchId ?? fallbackBranchId;

  const locationConfidence =
    typeof data.locationSummary?.confidenceScore === "number" ? data.locationSummary.confidenceScore : 0.6;

  const locationSummary = data.locationSummary as Record<string, unknown> | undefined;
  const frequentAreas = normalizeFrequentAreas(locationSummary);

  const topAreaLabel =
    (locationSummary && typeof locationSummary["usualAreaLabel"] === "string"
      ? (locationSummary["usualAreaLabel"] as string)
      : frequentAreas[0]?.label) || "Unknown";

  const lastLocationAt = formatTimestamp(locationSummary?.updatedAt);

  const idExpiry = formatTimestamp(data.idExpiryDate);

  const lastUpdated = formatTimestamp(data.updatedAt);

  const idExpiringSoon = data.idExpiresSoon ?? false;

  return {
    borrowerId: doc.id,
    fullName: data.fullName || "Unknown borrower",
    phone: data.phone || "N/A",
    branch: branchDocumentId || "Unassigned",
    branchDocumentId,
    primaryBranchId,
    kycStatus: normalizeStatus(data.kycStatus),
    kycMissingCount: typeof data.kycMissingCount === "number" ? data.kycMissingCount : 0,
    kycMissingTypes: Array.isArray(data.kycMissingTypes) ? data.kycMissingTypes.slice(0, 3) : [],
    idExpiryDate: idExpiry,
    idExpiringSoon,
    locationStatus: normalizeLocationQuality(data.locationStatus),
    locationConfidence: Math.min(Math.max(locationConfidence, 0), 1),
    topAreaLabel,
    frequentAreas,
    locationSummaryUpdatedAt: lastLocationAt,
    lastLocationAt,
    lastUpdated
  };
}

function collectBranchIds(borrowers: BorrowerSummary[]): string[] {
  const ids = new Set<string>();
  for (const borrower of borrowers) {
    if (borrower.branchDocumentId) {
      ids.add(borrower.branchDocumentId);
    }
  }
  return Array.from(ids);
}

async function fetchBranchNamesByIds(branchIds: string[]): Promise<Record<string, string>> {
  const branchNames: Record<string, string> = {};
  if (!db || !branchIds.length) {
    return branchNames;
  }

  const chunkSize = 10;
  for (let i = 0; i < branchIds.length; i += chunkSize) {
    const chunk = branchIds.slice(i, i + chunkSize);
    if (!chunk.length) {
      continue;
    }

    const snapshot = await db
      .collection("branches")
      .where(FieldPath.documentId(), "in", chunk)
      .get();

    snapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      const name = typeof data.name === "string" && data.name.trim() ? data.name : doc.id;
      branchNames[doc.id] = name;
    });
  }

  return branchNames;
}

async function enrichBorrowersWithBranchNames(borrowers: BorrowerSummary[]): Promise<BorrowerSummary[]> {
  if (!borrowers.length || !db || !hasAdminCredentials()) {
    return borrowers;
  }

  const branchIds = collectBranchIds(borrowers);
  if (!branchIds.length) {
    return borrowers;
  }

  try {
    const branchNameMap = await fetchBranchNamesByIds(branchIds);
    if (!Object.keys(branchNameMap).length) {
      return borrowers;
    }

    return borrowers.map((borrower) => {
      const branchId = borrower.branchDocumentId;
      if (!branchId) {
        return borrower;
      }

      const branchName = branchNameMap[branchId];
      if (!branchName) {
        return borrower;
      }

      if (borrower.branch === branchName) {
        return borrower;
      }

      return {
        ...borrower,
        branch: branchName
      };
    });
  } catch (error) {
    console.warn("Unable to resolve branch names:", error);
    return borrowers;
  }
}

async function fetchBorrowersFromFirestore(limit = 30): Promise<BorrowerSummary[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db.collection("borrowers").orderBy("updatedAt", "desc").limit(limit).get();
  if (snapshot.empty) {
    throw new Error("No borrower documents found.");
  }

  return snapshot.docs.map(mapBorrowerDoc);
}

export async function getBorrowerSummaries(limit = 30): Promise<BorrowerSummary[]> {
  if (hasAdminCredentials()) {
    try {
      const borrowers = await fetchBorrowersFromFirestore(limit);
      return await enrichBorrowersWithBranchNames(borrowers);
    } catch (error) {
      console.warn("Unable to fetch borrowers from Firestore:", error);
    }
  }

  return demoDashboardData.borrowers;
}

export async function getBorrowerSummaryById(borrowerId: string): Promise<BorrowerSummary | null> {
  if (!borrowerId) {
    return null;
  }
  if (hasAdminCredentials() && db) {
    try {
      const doc = await db.collection("borrowers").doc(borrowerId).get();
      if (doc.exists) {
        const borrower = mapBorrowerDoc(doc);
        const [enrichedBorrower] = await enrichBorrowersWithBranchNames([borrower]);
        return enrichedBorrower ?? borrower;
      }
      return null;
    } catch (error) {
      console.warn(`Unable to fetch borrower ${borrowerId}:`, error);
    }
  }

  return demoDashboardData.borrowers.find((borrower) => borrower.borrowerId === borrowerId) ?? null;
}
