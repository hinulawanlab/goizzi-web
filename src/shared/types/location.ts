export interface LocationObservation {
  observationId: string;
  source: string;
  capturedAt: string;
  label: string;
  geo: {
    lat: number;
    lng: number;
  };
  accuracyMeters?: number;
  createdBy?: string;
  notes?: string;
  confidenceScore?: number;
}

export interface LocationSummary {
  usualAreaLabel?: string;
  confidenceScore?: number;
  topAreas?: Array<{
    label: string;
    confidenceScore: number;
    lastSeen?: string;
  }>;
  updatedAt?: string;
}
