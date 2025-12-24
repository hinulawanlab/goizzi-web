import { notFound } from "next/navigation";

import Sidebar from "@/components/navigation/Sidebar";
import LocationTab from "@/components/borrowers/LocationTab";
import { getBorrowerSummaryById } from "@/shared/services/borrowerService";
import { getLocationObservations } from "@/shared/services/locationService";
import { getAppConfigConstants } from "@/shared/services/appConfigService";
import { refreshBorrowerLocationSummary } from "@/shared/services/locationSummaryService";

interface BorrowerProfilePageProps {
  params: Promise<{
    borrowerId?: string;
  }>;
}

export default async function BorrowerProfilePage({ params }: BorrowerProfilePageProps) {
  const { borrowerId } = await params;
  if (!borrowerId) {
    notFound();
  }

  const borrowerPromise = getBorrowerSummaryById(borrowerId);
  const observationsPromise = getLocationObservations(borrowerId, 30);
  const appConfigPromise = getAppConfigConstants();

  const borrower = await borrowerPromise;
  if (!borrower) {
    notFound();
  }

  const [observations, appConfig] = await Promise.all([observationsPromise, appConfigPromise]);
  const derivedSummary = await refreshBorrowerLocationSummary(borrowerId, observations, appConfig);

  const mergedBorrower = derivedSummary
    ? {
        ...borrower,
        topAreaLabel: derivedSummary.topAreaLabel ?? borrower.topAreaLabel,
        locationConfidence: derivedSummary.confidenceScore ?? borrower.locationConfidence,
        locationSummaryUpdatedAt: derivedSummary.updatedAt ?? borrower.locationSummaryUpdatedAt
      }
    : borrower;

  const topSourcesCount = derivedSummary?.sourceCount ?? 0;
  const topAreaLocation =
    derivedSummary?.topAreaGeo && typeof derivedSummary.topAreaGeo.lat === "number" && typeof derivedSummary.topAreaGeo.lng === "number"
      ? {
          lat: derivedSummary.topAreaGeo.lat,
          lng: derivedSummary.topAreaGeo.lng,
          label: derivedSummary.topAreaLabel ?? borrower.topAreaLabel,
          capturedAt: derivedSummary.updatedAt ?? borrower.locationSummaryUpdatedAt ?? borrower.lastLocationAt
        }
      : undefined;

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <Sidebar />
      <div className="mx-auto w-full max-w-8xl">
        <main className="space-y-6 pl-72">
          <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
            <p className="text-xs uppercase tracking-[0.6em] text-slate-400">Borrower profile</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {borrower.fullName}
            </h1>
            <p className="text-sm text-slate-500">
              {borrower.phone} Aú {borrower.branch}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                Location tab shows every observation tied to precise lat/lng, accuracy, and source so teams can verify the actual point before approving KYC.
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                Map uses OpenStreetMap for an inline, read-only view that links out to the full map when needed.
              </div>
            </div>
          </section>

          <LocationTab
            borrower={mergedBorrower}
            observations={observations}
            topSourcesCount={topSourcesCount}
            topAreaLocation={topAreaLocation}
          />
        </main>
      </div>
    </div>
  );
}
