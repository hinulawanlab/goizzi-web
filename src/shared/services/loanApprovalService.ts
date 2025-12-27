import { db } from "@/shared/singletons/firebaseAdmin";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import { buildBorrowerNoteData, sanitizeNote } from "@/shared/services/borrowerNoteUtils";
import { resolveActorName } from "@/shared/services/actorNameResolver";

interface LoanApprovalInput {
  borrowerId: string;
  applicationId: string;
  loanAmount: number;
  loanInterest: number;
  termMonths: number;
  approvedAt: string;
  actorName?: string;
  actorUserId?: string;
}

interface LoanApprovalResult {
  loanId: string;
  updatedAt: string;
  status: "Approved";
  statusUpdatedByName: string;
  note: BorrowerNote;
}

function parseApprovedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Approval date is invalid.");
  }
  return parsed.toISOString();
}

function toAmountUnits(amount: number): number {
  return Math.round(amount * 100);
}

export async function approveBorrowerApplicationToLoan(input: LoanApprovalInput): Promise<LoanApprovalResult> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.borrowerId || !input.applicationId) {
    throw new Error("Borrower or application id is missing.");
  }
  if (!Number.isFinite(input.loanAmount) || input.loanAmount <= 0) {
    throw new Error("Loan amount must be greater than 0.");
  }
  if (!Number.isFinite(input.loanInterest) || input.loanInterest < 0) {
    throw new Error("Loan interest must be 0 or higher.");
  }
  if (!Number.isFinite(input.termMonths) || input.termMonths <= 0) {
    throw new Error("Loan term must be greater than 0.");
  }

  const approvedAt = parseApprovedAt(input.approvedAt);

  const existingLoan = await db.collection("loans").where("applicationId", "==", input.applicationId).limit(1).get();
  if (!existingLoan.empty) {
    throw new Error("Loan already exists for this application.");
  }

  const borrowerRef = db.collection("borrowers").doc(input.borrowerId);
  const applicationRef = borrowerRef.collection("application").doc(input.applicationId);

  const [borrowerDoc, applicationDoc] = await Promise.all([borrowerRef.get(), applicationRef.get()]);
  if (!borrowerDoc.exists) {
    throw new Error("Borrower record not found.");
  }
  if (!applicationDoc.exists) {
    throw new Error("Application record not found.");
  }

  const borrowerData = borrowerDoc.data() || {};
  const applicationData = applicationDoc.data() || {};
  const loanDetails = (applicationData.loanDetails as Record<string, unknown>) ?? {};

  const branchId =
    typeof borrowerData.primaryBranchId === "string" && borrowerData.primaryBranchId.trim()
      ? borrowerData.primaryBranchId
      : null;
  if (!branchId) {
    throw new Error("Primary branch id is missing.");
  }

  const actorName = await resolveActorName(input.actorUserId, input.actorName);
  const createdAt = new Date().toISOString();
  const noteText = sanitizeNote("Status set to Approved.");

  const noteRef = borrowerRef.collection("notes").doc();
  const loanRef = db.collection("loans").doc();

  const noteData = buildBorrowerNoteData({
    noteId: noteRef.id,
    applicationId: input.applicationId,
    note: noteText,
    createdAt,
    createdByName: actorName,
    createdByUserId: input.actorUserId
  });

  const loanData = {
    loanId: loanRef.id,
    borrowerId: input.borrowerId,
    branchId,
    productId: typeof loanDetails.productId === "string" ? loanDetails.productId : undefined,
    productName: typeof loanDetails.productName === "string" ? loanDetails.productName : undefined,
    status: "approved",
    currency: "PHP",
    principalAmount: toAmountUnits(input.loanAmount),
    termMonths: Math.round(input.termMonths),
    loanInterest: input.loanInterest,
    approvedAt,
    createdAt,
    createdByUserId: input.actorUserId ?? null,
    updatedAt: createdAt,
    borrowerName: typeof borrowerData.fullName === "string" ? borrowerData.fullName : undefined,
    borrowerPhone: typeof borrowerData.phone === "string" ? borrowerData.phone : undefined,
    applicationId: input.applicationId,
    balances: {
      principalOutstandingAmount: 0,
      interestOutstandingAmount: 0,
      feesOutstandingAmount: 0,
      penaltiesOutstandingAmount: 0,
      totalOutstandingAmount: 0
    },
    totals: {
      totalPaidAmount: 0,
      totalFeesChargedAmount: 0,
      totalInterestChargedAmount: 0,
      totalPenaltiesChargedAmount: 0
    }
  };

  const batch = db.batch();
  batch.set(noteRef, noteData);
  batch.set(
    applicationRef,
    {
      status: "Approved",
      updatedAt: createdAt,
      statusUpdatedByName: actorName,
      statusUpdatedByUserId: input.actorUserId ?? null
    },
    { merge: true }
  );
  batch.set(loanRef, loanData);
  await batch.commit();

  return {
    loanId: loanRef.id,
    updatedAt: createdAt,
    status: "Approved",
    statusUpdatedByName: actorName,
    note: noteData
  };
}
