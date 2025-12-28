import { db } from "@/shared/singletons/firebaseAdmin";

interface LoanUpdateInput {
  loanId: string;
  principalAmount?: number;
  termMonths?: number;
  startDate?: string;
  status?: string;
}

interface LoanCancelInput {
  loanId: string;
  borrowerId?: string;
  applicationId?: string;
}

function addMonths(value: string, months: number): string | null {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  const date = new Date(parsed);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}

export async function updateLoanDetails(input: LoanUpdateInput) {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.loanId) {
    throw new Error("Loan id is missing.");
  }

  const updatedAt = new Date().toISOString();
  const payload: Record<string, unknown> = { updatedAt };

  if (typeof input.principalAmount === "number") {
    payload.principalAmount = input.principalAmount;
  }

  if (typeof input.termMonths === "number") {
    payload.termMonths = input.termMonths;
  }

  if (typeof input.startDate === "string") {
    payload.startDate = input.startDate;
  }

  if (typeof input.status === "string") {
    payload.status = input.status;
  }

  if (typeof input.startDate === "string" && typeof input.termMonths === "number") {
    const maturityDate = addMonths(input.startDate, input.termMonths);
    if (maturityDate) {
      payload.maturityDate = maturityDate;
    }
  }

  await db.collection("loans").doc(input.loanId).set(payload, { merge: true });

  return { updatedAt };
}

export async function cancelLoanAndApplication(input: LoanCancelInput) {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.loanId) {
    throw new Error("Loan id is missing.");
  }

  const updatedAt = new Date().toISOString();
  const batch = db.batch();
  const loanRef = db.collection("loans").doc(input.loanId);
  let borrowerId = input.borrowerId;
  let applicationId = input.applicationId;

  if (!borrowerId || !applicationId) {
    const loanDoc = await loanRef.get();
    if (loanDoc.exists) {
      const loanData = loanDoc.data() || {};
      if (!borrowerId && typeof loanData.borrowerId === "string") {
        borrowerId = loanData.borrowerId;
      }
      if (!applicationId && typeof loanData.applicationId === "string") {
        applicationId = loanData.applicationId;
      }
    }
  }
  batch.set(
    loanRef,
    {
      status: "cancelled",
      updatedAt,
      cancelledAt: updatedAt
    },
    { merge: true }
  );

  if (borrowerId && applicationId) {
    const applicationRef = db
      .collection("borrowers")
      .doc(borrowerId)
      .collection("application")
      .doc(applicationId);
    batch.set(
      applicationRef,
      {
        status: "cancelled",
        updatedAt
      },
      { merge: true }
    );
  }

  await batch.commit();

  return { updatedAt };
}
