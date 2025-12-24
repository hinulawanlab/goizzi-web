// src/shared/data/demoBranches.ts

import type { BranchSummary } from "@/shared/types/branch";

export const demoBranches: BranchSummary[] = [
  {
    branchId: "branch-makati",
    name: "Branch A - Makati",
    status: "active",
    region: "Metro Manila",
    address: "123 Paseo de Roxas, Makati City",
    borrowerCount: 134,
    activeLoans: 92,
    activeLoanCount: 92,
    kycPending: 14,
    locationAlerts: 5,
    lastUpdated: "2025-12-21",
    geo: {
      lat: 14.5559,
      lng: 121.0244
    }
  },
  {
    branchId: "branch-cebu",
    name: "Branch B - Cebu",
    status: "active",
    region: "Central Visayas",
    address: "56 Osmeña Blvd, Cebu City",
    borrowerCount: 98,
    activeLoans: 63,
    activeLoanCount: 92,
    kycPending: 8,
    locationAlerts: 2,
    lastUpdated: "2025-12-20",
    geo: {
      lat: 10.3143,
      lng: 123.8854
    }
  },
  {
    branchId: "branch-davao",
    name: "Branch C - Davao",
    status: "active",
    region: "Davao Region",
    address: "Unit 4, J.P. Laurel Ave, Davao City",
    borrowerCount: 76,
    activeLoans: 49,
    activeLoanCount: 92,
    kycPending: 5,
    locationAlerts: 0,
    lastUpdated: "2025-12-19",
    geo: {
      lat: 7.1907,
      lng: 125.4553
    }
  }
];
