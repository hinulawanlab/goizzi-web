import type { BorrowerSummary } from "@/shared/types/dashboard";
import type { LoanSummary } from "@/shared/types/loan";
import type { LoanApplication } from "@/shared/types/loanApplication";

interface BorrowerLoanApplicationFormProps {
  borrower: BorrowerSummary;
  loan: LoanSummary;
  application: LoanApplication;
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

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2 text-sm">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value || "N/A"}</span>
    </div>
  );
}

export default function BorrowerLoanApplicationForm({
  borrower,
  loan,
  application
}: BorrowerLoanApplicationFormProps) {
  const borrowerInfo = application.borrower ?? {};
  const loanDetails = application.loanDetails ?? {};
  const borrowerIncome = application.borrowerIncome ?? {};
  const spouse = application.spouse ?? {};
  const coMaker = application.coMaker ?? {};
  const coMakerIncome = application.coMakerIncome ?? {};
  const assets = application.borrowerAssets ?? {};

  return (
    <div className="space-y-8 text-slate-900">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Goizzi</p>
        <h1 className="text-2xl font-semibold">Loan Application Form</h1>
        <p className="text-sm text-slate-500">
          Application ID: {application.applicationId} | Loan ID: {loan.loanId}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Borrower</h2>
        <div>
          <DetailRow label="Full name" value={borrowerInfo.fullName ?? borrower.fullName} />
          <DetailRow label="Borrower ID" value={borrower.borrowerId} />
          <DetailRow label="Mobile" value={borrowerInfo.mobileNumber ?? borrower.phone} />
          <DetailRow label="Email" value={borrowerInfo.email} />
          <DetailRow label="Current address" value={borrowerInfo.currentAddress} />
          <DetailRow label="Date of birth" value={borrowerInfo.dateOfBirth} />
          <DetailRow label="Civil status" value={borrowerInfo.civilStatus} />
          <DetailRow label="Citizenship" value={borrowerInfo.citizenship} />
          <DetailRow label="Education" value={borrowerInfo.educationAttainment} />
          <DetailRow label="Submitted" value={formatDate(application.submittedAt ?? application.createdAt)} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Loan request</h2>
        <div>
          <DetailRow label="Product" value={loanDetails.productName ?? loanDetails.productId} />
          <DetailRow label="Amount applied" value={loanDetails.amountApplied} />
          <DetailRow label="Term (months)" value={loanDetails.term} />
          <DetailRow label="Purpose" value={loanDetails.purpose} />
          <DetailRow label="Marketing source" value={application.marketing?.source} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Income</h2>
        <div>
          <DetailRow label="Employer / business" value={borrowerIncome.employerName} />
          <DetailRow label="Occupation" value={borrowerIncome.occupation} />
          <DetailRow label="Net income" value={borrowerIncome.netIncome} />
          <DetailRow label="Years in role" value={borrowerIncome.yearsInRole} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Spouse</h2>
        <div>
          <DetailRow label="Full name" value={spouse.fullName} />
          <DetailRow label="Contact number" value={spouse.contactNumber} />
          <DetailRow label="Occupation" value={spouse.occupation} />
          <DetailRow label="Net income" value={spouse.netIncome} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Assets</h2>
        <div>
          <DetailRow label="Assets" value={assets.selections?.join(", ")} />
          <DetailRow label="Estimated value" value={assets.estimatedValue} />
          <DetailRow label="Details" value={assets.details} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Privacy consent (maker)</h2>
        <div>
          <p className="text-sm leading-6 text-slate-700">
          By signing below, I confirm that the information stated above are true and correct. I authorize the company
          or representative to verify and investigate from whatever sources it may consider appropriate, to include
          verification of my bank deposits. I hereby waive my rights under the Bank Secrecy Law (R.A. 1405, as amended)
          and Data Privacy Act (R.A. 10173), in favor of the company or its representatives. I understand that my
          application may be denied for any reason and the organization has no obligation to furnish the reason(s) for
          rejection. I also agree that the company will keep any documents I have submitted. Finally, I acknowledge
          that any false statements herein constitute falsification of commercial documents.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-sm text-slate-700">
                Applicant&apos;s Signature over Printed Name: ______________________
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Date: __________</div>
            </div>
            <div>
              <div className="text-sm text-slate-700">
                Spouse&apos;s Signature over Printed Name: ______________________
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Date: __________</div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Co-maker</h2>
        <div>
          <DetailRow label="Full name" value={coMaker.fullName} />
          <DetailRow label="Relationship" value={coMaker.relationshipToBorrower} />
          <DetailRow label="Mobile" value={coMaker.mobileNumber} />
          <DetailRow label="Address" value={coMaker.currentAddress} />
          <DetailRow label="Occupation" value={coMakerIncome.occupation} />
          <DetailRow label="Net income" value={coMakerIncome.netIncome} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Privacy consent (co-maker)</h2>
        <div>
          <p className="text-sm leading-6 text-slate-700">
            By signing below, I confirm that the information stated above is true and correct. I authorize the company
            or representative to verify and investigate from whatever sources it may consider appropriate, to include
            verification of my bank deposits. I hereby waive my rights under the Bank Secrecy Law (R.A. 1405, as
            amended) and Data Privacy Act (R.A. 10173), in favor of the company or its representatives. I understand
            that my application may be denied for any reason and the organization has no obligation to furnish the
            reason(s) for rejection. I also agree that the company will keep any documents I have submitted. Finally, I
            acknowledge that any false statements herein constitute falsification of commercial documents.
          </p>
          <div className="mt-8">
            <div className="text-sm text-slate-700">
              Co-maker&apos;s Signature over Printed Name: ______________________
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Date: __________</div>
          </div>
        </div>
      </section>
    </div>
  );
}
