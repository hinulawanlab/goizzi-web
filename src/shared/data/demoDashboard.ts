import type { DashboardData } from "@/shared/types/dashboard";

export const demoDashboardData: DashboardData = {
  metrics: {
    kycVerified: 7,
    kycNotVerified: 5,
    kycNeedsUpdate: 6,
    kycMissingDocs: 5,
    locationNeedsUpdate: 4,
    lowConfidenceLocations: 2
  },
  borrowers: [
    {
      borrowerId: "B-1001",
      fullName: "Ana de la Cruz",
      phone: "+63 912 345 6789",
      branch: "Branch A - Makati",
      isKYCverified: null,
      kycMissingCount: 1,
      kycMissingTypes: ["Selfie"],
      locationStatus: "Needs Update",
      locationConfidence: 0.58,
      topAreaLabel: "Makati City - Ayala",
      lastLocationAt: "2025-12-10",
      lastUpdated: "2025-12-10"
    },
    {
      borrowerId: "B-1002",
      fullName: "Jose Mari Santos",
      phone: "+63 917 111 2233",
      branch: "Branch B - Cebu",
      isKYCverified: true,
      kycMissingCount: 0,
      locationStatus: "Good",
      locationConfidence: 0.90,
      topAreaLabel: "Cebu City - Lahug",
      lastLocationAt: "2025-12-18",
      lastUpdated: "2025-12-18"
    },
    {
      borrowerId: "B-1003",
      fullName: "Janine Reyes",
      phone: "+63 998 444 5500",
      branch: "Branch C - Davao",
      isKYCverified: true,
      kycMissingCount: 0,
      locationStatus: "Good",
      locationConfidence: 0.95,
      topAreaLabel: "Davao City - Matina",
      lastLocationAt: "2025-12-19",
      lastUpdated: "2025-12-19"
    },
    {
      borrowerId: "B-1004",
      fullName: "Ronaldo Pineda",
      phone: "+63 939 222 3444",
      branch: "Branch A - Makati",
      isKYCverified: false,
      kycMissingCount: 2,
      kycMissingTypes: ["Signature", "Proof of Address"],
      locationStatus: "Low Confidence",
      locationConfidence: 0.45,
      topAreaLabel: "Quezon City - Novaliches",
      lastLocationAt: "2025-12-12",
      lastUpdated: "2025-12-13"
    },
    {
      borrowerId: "B-1005",
      fullName: "Luisa Valenzuela",
      phone: "+63 955 000 1122",
      branch: "Branch B - Cebu",
      isKYCverified: null,
      kycMissingCount: 1,
      kycMissingTypes: ["Selfie"],
      locationStatus: "Needs Update",
      locationConfidence: 0.60,
      topAreaLabel: "Cebu City - Carbon",
      lastLocationAt: "2025-12-01",
      lastUpdated: "2025-12-02"
    },
    {
      borrowerId: "B-1006",
      fullName: "Migs del Rosario",
      phone: "+63 988 555 6699",
      branch: "Branch C - Davao",
      isKYCverified: true,
      kycMissingCount: 0,
      locationStatus: "Good",
      locationConfidence: 0.92,
      topAreaLabel: "Davao City - Bajada",
      lastLocationAt: "2025-12-18",
      lastUpdated: "2025-12-18"
    }
  ],
  queue: [
    {
      borrowerId: "B-1001",
      reason: "Missing Selfie",
      tag: "KYC Missing",
      status: "Submitted for verification",
      timestamp: "2025-12-10"
    },
    {
      borrowerId: "B-1004",
      reason: "Low confidence locations (0.45)",
      tag: "Location Low Confidence",
      status: "Awaiting new observation",
      timestamp: "2025-12-12"
    },
    {
      borrowerId: "B-1005",
      reason: "No location updates in 20 days",
      tag: "Location Needs Update",
      status: "Manual reminder sent",
      timestamp: "2025-12-01"
    },
    {
      borrowerId: "B-1002",
      reason: "Waiting approval after verification",
      tag: "KYC Pending Approval",
      status: "Verification locked",
      timestamp: "2025-12-18"
    }
  ]
};
