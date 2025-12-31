export type KycVerificationStatus = "verified" | "not_verified" | "needs_update";

export type LocationQuality = "Good" | "Needs Update" | "Low Confidence";

export interface FrequentArea {
  label: string;
  confidence: number;
  lastSeen: string;
  count?: number;
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
}

export interface BorrowerSummary {
  borrowerId: string;
  fullName: string;
  phone: string;
  branch: string;
  branchDocumentId?: string;
  primaryBranchId?: string;
  isKYCverified: boolean | null;
  kycMissingCount: number | null;
  kycMissingTypes?: string[];
  locationStatus: LocationQuality;
  locationConfidence: number;
  topAreaLabel: string;
  frequentAreas?: FrequentArea[];
  locationSummaryUpdatedAt?: string;
  lastLocationAt: string;
  lastUpdated: string;
}

export interface QueueRow {
  borrowerId: string;
  reason: string;
  tag: string;
  status: string;
  timestamp: string;
}

export interface DashboardMetrics {
  kycVerified: number;
  kycNotVerified: number;
  kycNeedsUpdate: number;
  kycMissingDocs: number;
  locationNeedsUpdate: number;
  lowConfidenceLocations: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  borrowers: BorrowerSummary[];
  queue: QueueRow[];
}
