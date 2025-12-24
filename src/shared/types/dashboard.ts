export type KycStatus = "draft" | "submitted" | "verified" | "approved";

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
  kycStatus: KycStatus;
  kycMissingCount: number;
  kycMissingTypes?: string[];
  idExpiryDate: string;
  idExpiringSoon: boolean;
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
  kycPendingReview: number;
  kycPendingApproval: number;
  kycMissingDocs: number;
  idsExpiring: number;
  locationNeedsUpdate: number;
  lowConfidenceLocations: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  borrowers: BorrowerSummary[];
  queue: QueueRow[];
}
