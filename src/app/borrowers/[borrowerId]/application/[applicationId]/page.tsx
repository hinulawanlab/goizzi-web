// src/app/borrowers/[borrowerId]/application/[applicationId]/page.tsx
import { notFound } from "next/navigation";

import BorrowerApplicationTabs from "@/components/borrowers/BorrowerApplicationTabs";
import { getBorrowerSummaryById } from "@/shared/services/borrowerService";
import { requireStaffSession } from "@/shared/services/sessionService";
import { getBorrowerApplicationById } from "@/shared/services/applicationService";
import { getBorrowerReferences } from "@/shared/services/borrowerReferenceService";
import {
  getBorrowerBankStatementKycs,
  getBorrowerGovernmentIdKycs,
  getBorrowerHomePhotoKycs,
  getBorrowerOtherKycs,
  getBorrowerPayslipKycs,
  getBorrowerProofOfBillingKycs,
  getBorrowerPropertyTitleKycs,
  getBorrowerSelfieKycs
} from "@/shared/services/kycService";
import { getBorrowerNotesByApplication } from "@/shared/services/borrowerNoteService";

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

  await requireStaffSession();

  const borrowerPromise = getBorrowerSummaryById(borrowerId);
  const applicationPromise = getBorrowerApplicationById(borrowerId, applicationId);
  const referencesPromise = getBorrowerReferences(borrowerId);
  const proofOfBillingPromise = getBorrowerProofOfBillingKycs(borrowerId);
  const bankStatementPromise = getBorrowerBankStatementKycs(borrowerId);
  const payslipPromise = getBorrowerPayslipKycs(borrowerId);
  const propertyTitlePromise = getBorrowerPropertyTitleKycs(borrowerId);
  const otherPromise = getBorrowerOtherKycs(borrowerId);
  const selfiePromise = getBorrowerSelfieKycs(borrowerId);
  const governmentIdPromise = getBorrowerGovernmentIdKycs(borrowerId);
  const homePhotoPromise = getBorrowerHomePhotoKycs(borrowerId);
  const notesPromise = getBorrowerNotesByApplication(borrowerId, applicationId);

  const borrower = await borrowerPromise;
  const application = await applicationPromise;
  const references = await referencesPromise;
  const proofOfBillingKycs = await proofOfBillingPromise;
  const bankStatementKycs = await bankStatementPromise;
  const payslipKycs = await payslipPromise;
  const propertyTitleKycs = await propertyTitlePromise;
  const otherKycs = await otherPromise;
  const selfieKycs = await selfiePromise;
  const governmentIdKycs = await governmentIdPromise;
  const homePhotoKycs = await homePhotoPromise;
  const notes = await notesPromise;

  if (!borrower || !application) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-none">
        <main className="space-y-6">
          <BorrowerApplicationTabs
            borrower={borrower}
            application={application}
            references={references}
            proofOfBillingKycs={proofOfBillingKycs}
            bankStatementKycs={bankStatementKycs}
            payslipKycs={payslipKycs}
            propertyTitleKycs={propertyTitleKycs}
            otherKycs={otherKycs}
            selfieKycs={selfieKycs}
            governmentIdKycs={governmentIdKycs}
            homePhotoKycs={homePhotoKycs}
            notes={notes}
          />
        </main>
      </div>
    </div>
  );
}
