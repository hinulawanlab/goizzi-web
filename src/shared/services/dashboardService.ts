import { demoDashboardData } from "@/shared/data/demoDashboard";
import { getBorrowerSummaries } from "@/shared/services/borrowerService";
import type { DashboardData, DashboardMetrics } from "@/shared/types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  const borrowers = await getBorrowerSummaries(10);
  const kycVerifiedCount = borrowers.filter((b) => b.isKYCverified === true).length;
  const kycNotVerifiedCount = borrowers.filter((b) => b.isKYCverified === false).length;
  const kycNeedsUpdateCount = borrowers.filter((b) => b.isKYCverified == null).length;
  const metrics: DashboardMetrics = {
    kycVerified: kycVerifiedCount,
    kycNotVerified: kycNotVerifiedCount,
    kycNeedsUpdate: kycNeedsUpdateCount,
    kycMissingDocs: borrowers.filter((b) => (b.kycMissingCount ?? 0) > 0).length,
    locationNeedsUpdate: borrowers.filter((b) => b.locationStatus === "Needs Update").length,
    lowConfidenceLocations: borrowers.filter((b) => b.locationStatus === "Low Confidence").length
  };

  return {
    metrics,
    borrowers,
    queue: demoDashboardData.queue
  };
}
