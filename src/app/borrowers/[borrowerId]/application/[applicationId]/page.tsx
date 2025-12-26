// src/app/borrowers/[borrowerId]/application/[applicationId]/page.tsx
import { notFound } from "next/navigation";

import BorrowerApplicationTabs from "@/components/borrowers/BorrowerApplicationTabs";
import { getBorrowerSummaryById } from "@/shared/services/borrowerService";
import { getBorrowerApplicationById } from "@/shared/services/applicationService";
import { getBorrowerReferences } from "@/shared/services/borrowerReferenceService";
import { getBorrowerProofOfBillingKycs } from "@/shared/services/kycService";

interface BorrowerApplicationPageProps {
  params: Promise<{
    borrowerId?: string;
    applicationId?: string;
  }>;
}

export default async function BorrowerApplicationPage({ params }: BorrowerApplicationPageProps) {
  const { borrowerId, applicationId } = await params;
  if (!borrowerId || !applicationId) {
    notFound();
  }

  const borrowerPromise = getBorrowerSummaryById(borrowerId);
  const applicationPromise = getBorrowerApplicationById(borrowerId, applicationId);
  const referencesPromise = getBorrowerReferences(borrowerId);
  const proofOfBillingPromise = getBorrowerProofOfBillingKycs(borrowerId);

  const borrower = await borrowerPromise;
  const application = await applicationPromise;
  const references = await referencesPromise;
  const proofOfBillingKycs = await proofOfBillingPromise;

  if (!borrower || !application) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        <main className="space-y-6">
          <BorrowerApplicationTabs
            borrower={borrower}
            application={application}
            references={references}
            proofOfBillingKycs={proofOfBillingKycs}
          />
        </main>
      </div>
    </div>
  );
}
