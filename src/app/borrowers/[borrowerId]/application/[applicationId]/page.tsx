import { notFound } from "next/navigation";

import { getBorrowerSummaryById } from "@/shared/services/borrowerService";
import { getBorrowerApplicationById } from "@/shared/services/applicationService";

interface BorrowerApplicationPageProps {
  params: Promise<{
    borrowerId?: string;
    applicationId?: string;
  }>;
}

function formatDate(value?: string) {
  if (!value || value === "N/A") {
    return "N/A";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatAmount(value?: string) {
  if (!value || value === "N/A") {
    return "N/A";
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return parsed.toLocaleString("en-US");
}

function DetailRow({ label, value }: { label: string; value?: string | boolean }) {
  const displayValue = typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "N/A";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{displayValue}</p>
    </div>
  );
}

export default async function BorrowerApplicationPage({ params }: BorrowerApplicationPageProps) {
  const { borrowerId, applicationId } = await params;
  if (!borrowerId || !applicationId) {
    notFound();
  }

  const borrowerPromise = getBorrowerSummaryById(borrowerId);
  const applicationPromise = getBorrowerApplicationById(borrowerId, applicationId);

  const borrower = await borrowerPromise;
  const application = await applicationPromise;

  if (!borrower || !application) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        <main className="space-y-6">
          <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
            <p className="text-xs uppercase tracking-[0.6em] text-slate-400">Loan application</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {application.loanDetails?.productName ?? "Loan application"}
            </h1>
            <p className="text-sm text-slate-500">
              {borrower.fullName} - {borrower.branch}
            </p>
            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                Application ID: {application.applicationId}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                Status: {application.status}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Loan details</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="Product" value={application.loanDetails?.productName} />
                <DetailRow label="Product ID" value={application.loanDetails?.productId} />
                <DetailRow label="Amount applied" value={formatAmount(application.loanDetails?.amountApplied)} />
                <DetailRow label="Term" value={application.loanDetails?.term} />
                <DetailRow label="Purpose" value={application.loanDetails?.purpose} />
                <DetailRow label="Submitted" value={formatDate(application.submittedAt ?? application.createdAt)} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Borrower snapshot</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {application.borrower.fullName ?? borrower.fullName}
              </p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="Mobile" value={application.borrower.mobileNumber} />
                <DetailRow label="Email" value={application.borrower.email} />
                <DetailRow label="Date of birth" value={application.borrower.dateOfBirth} />
                <DetailRow label="Civil status" value={application.borrower.civilStatus} />
                <DetailRow label="Current address" value={application.borrower.currentAddress} />
                <DetailRow label="Provincial same as current" value={application.borrower.provincialSameAsCurrent} />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Employment & income</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="Employer" value={application.borrowerIncome?.employerName} />
                <DetailRow label="Occupation" value={application.borrowerIncome?.occupation} />
                <DetailRow label="Net income" value={application.borrowerIncome?.netIncome} />
                <DetailRow label="Years in role" value={application.borrowerIncome?.yearsInRole} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Assets & marketing</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="Assets" value={application.borrowerAssets?.selections?.join(", ")} />
                <DetailRow label="Estimated value" value={application.borrowerAssets?.estimatedValue} />
                <DetailRow label="Asset notes" value={application.borrowerAssets?.details} />
                <DetailRow label="Marketing source" value={application.marketing?.source} />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Co-maker</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="Full name" value={application.coMaker?.fullName} />
                <DetailRow label="Relationship" value={application.coMaker?.relationshipToBorrower} />
                <DetailRow label="Mobile" value={application.coMaker?.mobileNumber} />
                <DetailRow label="Address" value={application.coMaker?.currentAddress} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Co-maker income</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="Employer" value={application.coMakerIncome?.employerName} />
                <DetailRow label="Net income" value={application.coMakerIncome?.netIncome} />
                <DetailRow label="Occupation" value={application.coMakerIncome?.occupation} />
                <DetailRow label="Years in role" value={application.coMakerIncome?.yearsInRole} />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Spouse</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="Full name" value={application.spouse?.fullName} />
                <DetailRow label="Occupation" value={application.spouse?.occupation} />
                <DetailRow label="Net income" value={application.spouse?.netIncome} />
                <DetailRow label="Contact" value={application.spouse?.contactNumber} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Audit</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="Created" value={formatDate(application.createdAt)} />
                <DetailRow label="Submitted" value={formatDate(application.submittedAt)} />
                <DetailRow label="Updated" value={formatDate(application.updatedAt)} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

