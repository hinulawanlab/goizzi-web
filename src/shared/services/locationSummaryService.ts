import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import type { AppConfigConstants } from "@/shared/services/appConfigService";
import { deriveFrequentAreas } from "@/shared/services/locationAnalyzer";
import type { LocationObservation } from "@/shared/types/location";

export interface DerivedLocationSummary {
  topAreaLabel?: string;
  confidenceScore?: number;
  updatedAt?: string;
  frequentAreas: Array<{
    label: string;
    confidence: number;
    lastSeen: string;
    lat?: number;
    lng?: number;
    representative?: {
      observationId: string;
      source: string;
      capturedAt: string;
      label: string;
      geo: {
        lat: number;
        lng: number;
      };
      accuracyMeters?: number;
    };
  }>;
  sourceCount: number;
  topAreaGeo?: {
    lat: number;
    lng: number;
    label?: string;
    capturedAt?: string;
    accuracyMeters?: number;
  };
}

const BORROWERS_COLLECTION = "borrowers";

export async function refreshBorrowerLocationSummary(
  borrowerId: string,
  observations: LocationObservation[],
  constants: AppConfigConstants
): Promise<DerivedLocationSummary | null> {
  if (!borrowerId || observations.length === 0) {
    return null;
  }

  const frequentAreas = deriveFrequentAreas(observations, {
    radiusMeters: constants.LOCATION_CLUSTER_RADIUS_METERS,
    minPoints: constants.LOCATION_CLUSTER_MIN_POINTS,
    limit: constants.RECENT_TOP_LOCATION_LIMIT
  });

  if (frequentAreas.length === 0) {
    return null;
  }

  const now = new Date().toISOString();
  type LocationSummaryPayload = {
    usualAreaLabel: string;
    confidenceScore: number;
    topAreas: Array<{
      label: string;
      confidenceScore: number;
      lastSeen: string;
      lat?: number;
      lng?: number;
    }>;
    updatedAt: string;
    usualAreaGeo?: {
      lat: number;
      lng: number;
    };
  };

  const topRepresentative = frequentAreas[0].representative;

  const locationSummaryPayload: LocationSummaryPayload = {
    usualAreaLabel: frequentAreas[0].label,
    confidenceScore: frequentAreas[0].confidence,
    topAreas: frequentAreas.map((area) => ({
      label: area.label,
      confidenceScore: area.confidence,
      lastSeen: area.lastSeen,
      lat: area.lat,
      lng: area.lng
    })),
    updatedAt: now
  };
  if (topRepresentative) {
    locationSummaryPayload["usualAreaGeo"] = {
      lat: topRepresentative.geo.lat,
      lng: topRepresentative.geo.lng
    };
  }

  if (hasAdminCredentials() && db) {
    await db
      .collection(BORROWERS_COLLECTION)
      .doc(borrowerId)
      .set({ locationSummary: locationSummaryPayload }, { merge: true });
  }

  return {
    topAreaLabel: locationSummaryPayload.usualAreaLabel,
    confidenceScore: locationSummaryPayload.confidenceScore,
    updatedAt: locationSummaryPayload.updatedAt,
    frequentAreas,
    sourceCount: frequentAreas[0].count ?? 0,
    topAreaGeo:
      topRepresentative && topRepresentative.geo
        ? {
            lat: topRepresentative.geo.lat,
            lng: topRepresentative.geo.lng,
            label: topRepresentative.label,
            capturedAt: topRepresentative.capturedAt,
            accuracyMeters: topRepresentative.accuracyMeters
          }
        : undefined
  };
}
