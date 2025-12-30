import { db } from "@/shared/singletons/firebaseAdmin";
import {
  buildRepaymentSchedule,
  resolveMaturityDate,
  resolveNextDueDate
} from "@/shared/utils/repaymentSchedule";

interface LoanUpdateInput {
  loanId: string;
  principalAmount?: number;
  termMonths?: number;
  interestRate?: number;
  paymentFrequency?: number;
  startDate?: string;
  status?: string;
}

interface LoanCancelInput {
  loanId: string;
  borrowerId?: string;
  applicationId?: string;
}

function formatDateValue(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return value.split("T")[0];
  }
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return ((value as { toDate?: () => Date }).toDate as () => Date)().toISOString().split("T")[0];
  }
  const toMillisFn = (value as { toMillis?: () => number }).toMillis;
  if (typeof toMillisFn === "function") {
    return new Date(toMillisFn()).toISOString().split("T")[0];
  }
  const seconds = (value as { _seconds?: number })._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toISOString().split("T")[0];
  }
  return null;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function resolveExpectedPaymentAmount(
  principalAmount: number,
  termMonths: number,
  interestRate: number,
  paymentFrequency: number
) {
  if (termMonths <= 0 || paymentFrequency <= 0) {
    return null;
  }
  const totalPayments = termMonths * paymentFrequency;
  const totalInterest = principalAmount * termMonths * interestRate;
  return Math.round(totalInterest / totalPayments);
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
  const loanRef = db.collection("loans").doc(input.loanId);
  let existingLoanData: Record<string, unknown> | null = null;

  if (typeof input.principalAmount === "number") {
    payload.principalAmount = input.principalAmount;
  }

  if (typeof input.termMonths === "number") {
    payload.termMonths = input.termMonths;
  }

  if (typeof input.interestRate === "number") {
    payload.interestRate = input.interestRate;
  }

  if (typeof input.paymentFrequency === "number") {
    payload.paymentFrequency = input.paymentFrequency;
  }

  if (typeof input.startDate === "string") {
    payload.startDate = input.startDate;
  }

  if (typeof input.status === "string") {
    payload.status = input.status;
  }

  const needsLoanData =
    input.startDate === undefined || input.termMonths === undefined || input.paymentFrequency === undefined;
  if (needsLoanData) {
    const loanDoc = await loanRef.get();
    if (loanDoc.exists) {
      existingLoanData = (loanDoc.data() as Record<string, unknown>) ?? null;
    }
  }

  const resolvedStartDate =
    typeof input.startDate === "string" ? input.startDate : formatDateValue(existingLoanData?.startDate);
  const resolvedTermMonths =
    typeof input.termMonths === "number" ? input.termMonths : toNumber(existingLoanData?.termMonths);
  const resolvedPaymentFrequency =
    typeof input.paymentFrequency === "number"
      ? input.paymentFrequency
      : toNumber(existingLoanData?.paymentFrequency);
  const resolvedPrincipalAmount =
    typeof input.principalAmount === "number" ? input.principalAmount : toNumber(existingLoanData?.principalAmount);
  const resolvedInterestRate = toNumber(existingLoanData?.interestRate);

  let schedule: string[] = [];
  if (
    typeof resolvedStartDate === "string" &&
    typeof resolvedTermMonths === "number" &&
    typeof resolvedPaymentFrequency === "number"
  ) {
    schedule = buildRepaymentSchedule(resolvedStartDate, resolvedTermMonths, resolvedPaymentFrequency);
    const maturityDate = resolveMaturityDate(resolvedStartDate, resolvedTermMonths);
    const nextDueDate = resolveNextDueDate(schedule);

    if (maturityDate) {
      payload.maturityDate = maturityDate;
    }
    if (nextDueDate) {
      payload.nextDueDate = nextDueDate;
    }
  }

  const batch = db.batch();
  batch.set(loanRef, payload, { merge: true });

  if (schedule.length) {
    const expectedPaymentAmount =
      typeof resolvedPrincipalAmount === "number" && typeof resolvedInterestRate === "number"
        ? resolveExpectedPaymentAmount(
            resolvedPrincipalAmount,
            resolvedTermMonths ?? 0,
            resolvedInterestRate,
            resolvedPaymentFrequency ?? 0
          )
        : null;
    const scheduleSnapshot = await loanRef.collection("repaymentSchedule").get();
    scheduleSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    schedule.forEach((dueDate, index) => {
      const entryRef = loanRef.collection("repaymentSchedule").doc(`installment-${index + 1}`);
      batch.set(entryRef, {
        dueDate,
        installmentNumber: index + 1,
        createdAt: updatedAt,
        expectedPaymentAmount,
        scheduleType: "regular"
      });
    });
  }

  await batch.commit();

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
