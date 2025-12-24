export type BranchStatus = "active" | "inactive";

export interface BranchSummary {
  branchId: string;
  name: string;
  status: BranchStatus;
  region: string;
  address: string;
  borrowerCount: number;
  activeLoans: number;
  activeLoanCount: number;
  kycPending: number;
  locationAlerts: number;
  lastUpdated: string;
  geo?: {
    lat: number;
    lng: number;
  };
}
