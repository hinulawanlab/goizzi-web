import { demoDashboardData } from "@/shared/data/demoDashboard";
import { getBorrowerSummaries } from "@/shared/services/borrowerService";
import type { DashboardData, DashboardMetrics } from "@/shared/types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  const borrowers = await getBorrowerSummaries(10);
  const metrics: DashboardMetrics = {
    kycPendingReview: borrowers.filter((b) => b.kycStatus === "submitted").length,
    kycPendingApproval: borrowers.filter((b) => b.kycStatus === "verified").length,
    kycMissingDocs: borrowers.filter((b) => b.kycMissingCount > 0).length,
    idsExpiring: borrowers.filter((b) => b.idExpiringSoon).length,
    locationNeedsUpdate: borrowers.filter((b) => b.locationStatus === "Needs Update").length,
    lowConfidenceLocations: borrowers.filter((b) => b.locationStatus === "Low Confidence").length
  };

  return {
    metrics,
    borrowers,
    queue: demoDashboardData.queue
  };
}
