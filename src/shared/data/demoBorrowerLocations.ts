import type { LocationObservation } from "@/shared/types/location";

export const demoBorrowerLocations: Record<string, LocationObservation[]> = {
  "B-1001": [
    {
      observationId: "obs-001",
      source: "manual",
      capturedAt: "2025-12-20T10:12:00Z",
      label: "Makati - Ayala Triangle",
      geo: { lat: 14.5546, lng: 121.0245 },
      accuracyMeters: 15,
      createdBy: "user-manager-003",
      notes: "Borrower confirmed location during office visit.",
      confidenceScore: 0.88
    },
    {
      observationId: "obs-002",
      source: "payment",
      capturedAt: "2025-12-10T14:05:00Z",
      label: "Makati - Paseo de Roxas",
      geo: { lat: 14.5540, lng: 121.0241 },
      accuracyMeters: 30,
      createdBy: "user-encoder-002",
      confidenceScore: 0.76
    },
    {
      observationId: "obs-003",
      source: "borrowerReported",
      capturedAt: "2025-11-25T09:30:00Z",
      label: "Makati - San Lorenzo",
      geo: { lat: 14.5467, lng: 121.0288 },
      accuracyMeters: 50,
      createdBy: "user-encoder-002",
      confidenceScore: 0.62
    }
  ]
};
