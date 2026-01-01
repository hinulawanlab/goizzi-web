import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import {
  LOCATION_CLUSTER_MIN_POINTS,
  LOCATION_CLUSTER_RADIUS_METERS,
  MAX_LOCATION_CONFIDENCE,
  MIN_LOCATION_CONFIDENCE,
  RECENT_TOP_LOCATION_LIMIT
} from "@/appConfig/constants";

export interface AppConfigConstants {
  LOCATION_CLUSTER_RADIUS_METERS: number;
  LOCATION_CLUSTER_MIN_POINTS: number;
  RECENT_TOP_LOCATION_LIMIT: number;
  MIN_LOCATION_CONFIDENCE: number;
  MAX_LOCATION_CONFIDENCE: number;
}

const FALLBACK_CONSTANTS: AppConfigConstants = {
  LOCATION_CLUSTER_RADIUS_METERS,
  LOCATION_CLUSTER_MIN_POINTS,
  RECENT_TOP_LOCATION_LIMIT,
  MIN_LOCATION_CONFIDENCE,
  MAX_LOCATION_CONFIDENCE
};

const COLLECTION_PATH = "appConfig";
const DOCUMENT_ID = "constants";

let cachedConstants: AppConfigConstants | null = null;

function coerceNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

async function fetchFromFirestore(): Promise<AppConfigConstants | null> {
  if (!hasAdminCredentials() || !db) {
    return null;
  }

  try {
    const snapshot = await db.collection(COLLECTION_PATH).doc(DOCUMENT_ID).get();
    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data() || {};
    return {
      LOCATION_CLUSTER_RADIUS_METERS: coerceNumber(
        data.LOCATION_CLUSTER_RADIUS_METERS,
        FALLBACK_CONSTANTS.LOCATION_CLUSTER_RADIUS_METERS
      ),
      LOCATION_CLUSTER_MIN_POINTS: coerceNumber(
        data.LOCATION_CLUSTER_MIN_POINTS,
        FALLBACK_CONSTANTS.LOCATION_CLUSTER_MIN_POINTS
      ),
      RECENT_TOP_LOCATION_LIMIT: coerceNumber(
        data.RECENT_TOP_LOCATION_LIMIT,
        FALLBACK_CONSTANTS.RECENT_TOP_LOCATION_LIMIT
      ),
      MIN_LOCATION_CONFIDENCE: coerceNumber(
        data.MIN_LOCATION_CONFIDENCE,
        FALLBACK_CONSTANTS.MIN_LOCATION_CONFIDENCE
      ),
      MAX_LOCATION_CONFIDENCE: coerceNumber(
        data.MAX_LOCATION_CONFIDENCE,
        FALLBACK_CONSTANTS.MAX_LOCATION_CONFIDENCE
      )
    };
  } catch (error) {
    console.warn("Unable to fetch app config constants:", error);
    return null;
  }
}

export async function getAppConfigConstants(): Promise<AppConfigConstants> {
  if (cachedConstants) {
    return cachedConstants;
  }

  const remote = await fetchFromFirestore();
  cachedConstants = remote ?? FALLBACK_CONSTANTS;
  return cachedConstants;
}

export function clearAppConfigConstantsCache() {
  cachedConstants = null;
}
