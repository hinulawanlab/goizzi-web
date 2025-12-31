// src/app/borrowers/[borrowerId]/loan/[loanId]/application-form/page.tsx
import "./print.css";
import { notFound } from "next/navigation";

import BorrowerLoanApplicationForm from "@/components/borrowers/BorrowerLoanApplicationForm";
import PrintControls from "@/components/shared/PrintControls";
import PrintOnLoad from "@/components/shared/PrintOnLoad";
import { getBorrowerSummaryById } from "@/shared/services/borrowerService";
import { getBorrowerApplicationById } from "@/shared/services/applicationService";
import { getLoanById } from "@/shared/services/loanService";
import { requireStaffSession } from "@/shared/services/sessionService";

interface BorrowerLoanApplicationFormPageProps {
  params: Promise<{
    borrowerId?: string;
    loanId?: string;
  }>;
}

export default async function BorrowerLoanApplicationFormPage({ params }: BorrowerLoanApplicationFormPageProps) {
  const { borrowerId, loanId } = await params;
  if (!borrowerId || !loanId) {
    notFound();
  }

  await requireStaffSession();

  const borrowerPromise = getBorrowerSummaryById(borrowerId);
  const loanPromise = getLoanById(loanId);

  const [borrower, loan] = await Promise.all([borrowerPromise, loanPromise]);

  if (!borrower || !loan || loan.borrowerId !== borrowerId) {
    notFound();
  }

  if (!loan.applicationId) {
    return (
      <div className="min-h-screen bg-white px-8 py-10 text-slate-900">
        <h1 className="text-2xl font-semibold">Loan application form</h1>
        <p className="mt-4 text-sm text-slate-600">No application ID is linked to this loan.</p>
      </div>
    );
  }

  const application = await getBorrowerApplicationById(borrowerId, loan.applicationId);

  if (!application) {
    return (
      <div className="min-h-screen bg-white px-8 py-10 text-slate-900">
        <h1 className="text-2xl font-semibold">Loan application form</h1>
        <p className="mt-4 text-sm text-slate-600">Application record not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-8 py-10 text-slate-900">
      <div className="print-vertical-brand">GoIzzi! We make it easy! | loan application</div>
      <div className="print-footer" aria-hidden="true" />
      <div className="mx-auto w-full max-w-4xl">
        <PrintOnLoad />
        <PrintControls />
        <BorrowerLoanApplicationForm borrower={borrower} loan={loan} application={application} />
      </div>
    </div>
  );
}
