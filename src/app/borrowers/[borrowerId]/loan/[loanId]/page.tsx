// src/app/borrowers/[borrowerId]/loan/[loanId]/page.tsx
import { notFound } from "next/navigation";

import BorrowerLoanTabs from "@/components/borrowers/BorrowerLoanTabs";
import { getBorrowerSummaryById } from "@/shared/services/borrowerService";
import { requireStaffSession } from "@/shared/services/sessionService";
import { getLoanById } from "@/shared/services/loanService";
import { getLoanRepaymentSchedule } from "@/shared/services/loanRepaymentScheduleService";
import { getLoanNotesByLoanId } from "@/shared/services/loanNoteService";
import { getActiveLoanProducts } from "@/shared/services/productService";

interface BorrowerLoanPageProps {
  params: Promise<{
    borrowerId?: string;
    loanId?: string;
  }>;
}

export default async function BorrowerLoanPage({ params }: BorrowerLoanPageProps) {
  const { borrowerId, loanId } = await params;
  if (!borrowerId || !loanId) {
    notFound();
  }

  await requireStaffSession();

  const borrowerPromise = getBorrowerSummaryById(borrowerId);
  const loanPromise = getLoanById(loanId);
  const schedulePromise = getLoanRepaymentSchedule(loanId);
  const loanNotesPromise = getLoanNotesByLoanId(loanId);
  const loanProductsPromise = getActiveLoanProducts();

  const [borrower, loan, repaymentSchedule, loanNotesResult, loanProducts] = await Promise.all([
    borrowerPromise,
    loanPromise,
    schedulePromise,
    loanNotesPromise,
    loanProductsPromise
  ]);

  if (!borrower || !loan || loan.borrowerId !== borrowerId) {
    notFound();
  }

  return (
    <div className="h-screen overflow-hidden bg-transparent px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-none">
        <main className="space-y-6">
          <BorrowerLoanTabs
            borrower={borrower}
            loan={loan}
            repaymentSchedule={repaymentSchedule}
            loanNotes={loanNotesResult.notes}
            loanNotesError={loanNotesResult.error}
            loanProducts={loanProducts}
          />
        </main>
      </div>
    </div>
  );
}
