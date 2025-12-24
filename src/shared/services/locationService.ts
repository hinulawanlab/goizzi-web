import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoBorrowerLocations } from "@/shared/data/demoBorrowerLocations";
import type { LocationObservation } from "@/shared/types/location";

function formatTimestamp(value: unknown): string {
  if (!value) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return ((value as { toDate?: () => Date }).toDate as () => Date)().toISOString();
  }

  {
    const toMillis = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillis === "function") {
      return new Date(toMillis()).toISOString();
    }
  }

  {
    const seconds = (value as { _seconds?: number })._seconds;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000).toISOString();
    }
  }

  return "N/A";
}

function buildGeoPoint(data: Record<string, unknown>): { lat: number; lng: number } {
  if (data.geo && typeof data.geo === "object") {
    if (typeof (data.geo as { latitude?: number; longitude?: number }).latitude === "number") {
      return {
        lat: (data.geo as { latitude?: number }).latitude ?? 0,
        lng: (data.geo as { longitude?: number }).longitude ?? 0
      };
    }

    if (typeof (data.geo as { lat?: number; lng?: number }).lat === "number") {
      return {
        lat: (data.geo as { lat?: number }).lat ?? 0,
        lng: (data.geo as { lng?: number }).lng ?? 0
      };
    }
  }

  if (typeof data.lat === "number" && typeof data.lng === "number") {
    return { lat: data.lat, lng: data.lng };
  }

  return { lat: 0, lng: 0 };
}

function mapObservationDoc(doc: DocumentSnapshot): LocationObservation {
  const data = doc.data() || {};
  const geo = buildGeoPoint(data);

  return {
    observationId: doc.id,
    source: typeof data.source === "string" ? data.source : "manual",
    capturedAt: formatTimestamp(data.capturedAt),
    label: typeof data.label === "string" ? data.label : "Location",
    geo,
    accuracyMeters: typeof data.accuracyMeters === "number" ? data.accuracyMeters : undefined,
    createdBy: typeof data.createdByUserId === "string" ? data.createdByUserId : undefined,
    notes: typeof data.notes === "string" ? data.notes : undefined,
    confidenceScore: typeof data.confidenceScore === "number" ? data.confidenceScore : undefined
  };
}

async function fetchObservationsFromFirestore(borrowerId: string, limit = 20): Promise<LocationObservation[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("locationObservations")
    .orderBy("capturedAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    throw new Error("No location observations found.");
  }

  return snapshot.docs.map(mapObservationDoc);
}

export async function getLocationObservations(borrowerId: string, limit = 20): Promise<LocationObservation[]> {
  if (!borrowerId) {
    return [];
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchObservationsFromFirestore(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch location observations for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerLocations[borrowerId] ?? [];
}
