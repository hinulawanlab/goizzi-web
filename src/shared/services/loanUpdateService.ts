import { Timestamp } from "firebase-admin/firestore";

import { db } from "@/shared/singletons/firebaseAdmin";
import { buildLoanNoteData } from "@/shared/services/loanNoteUtils";
import { resolveActorName } from "@/shared/services/actorNameResolver";
import {
  buildRepaymentSchedule,
  resolveMaturityDate,
  resolveNextDueDate
} from "@/shared/utils/repaymentSchedule";

interface LoanUpdateInput {
  loanId: string;
  productId?: string;
  productName?: string;
  principalAmount?: number;
  termMonths?: number;
  interestRate?: number;
  paymentFrequency?: number;
  startDate?: string;
  status?: string;
  action?: "update" | "proceed";
}

interface LoanCancelInput {
  loanId: string;
  borrowerId?: string;
  applicationId?: string;
  reason?: string;
  actorUserId?: string;
  actorName?: string;
}

interface LoanCloseInput {
  loanId: string;
  reason: string;
  borrowerId?: string;
  applicationId?: string;
  actorUserId?: string;
  actorName?: string;
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

function toTimestamp(value: unknown): Timestamp | null {
  if (!value) {
    return null;
  }
  if (value instanceof Timestamp) {
    return value;
  }
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed);
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    const date = (value as { toDate?: () => Date }).toDate?.();
    return date ? Timestamp.fromDate(date) : null;
  }
  const toMillisFn = (value as { toMillis?: () => number }).toMillis;
  if (typeof toMillisFn === "function") {
    return Timestamp.fromMillis(toMillisFn());
  }
  const seconds = (value as { _seconds?: number })._seconds;
  const nanos = (value as { _nanoseconds?: number })._nanoseconds;
  if (typeof seconds === "number") {
    return new Timestamp(seconds, typeof nanos === "number" ? nanos : 0);
  }
  return null;
}

function dateStringToTimestamp(value?: string | null): Timestamp | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed);
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

  const updatedAt = Timestamp.now();
  const payload: Record<string, unknown> = { updatedAt };
  const loanRef = db.collection("loans").doc(input.loanId);
  let existingLoanData: Record<string, unknown> | null = null;

  if (typeof input.principalAmount === "number") {
    payload.principalAmount = input.principalAmount;
  }

  if (typeof input.productId === "string") {
    payload.productId = input.productId;
  }

  if (typeof input.productName === "string") {
    payload.productName = input.productName;
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
    payload.startDate = dateStringToTimestamp(input.startDate);
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

    const maturityTimestamp = dateStringToTimestamp(maturityDate);
    const nextDueTimestamp = dateStringToTimestamp(nextDueDate);
    if (maturityTimestamp) {
      payload.maturityDate = maturityTimestamp;
    }
    if (nextDueTimestamp) {
      payload.nextDueDate = nextDueTimestamp;
    }
  }

  if (input.action === "proceed") {
    const createdAt = toTimestamp(existingLoanData?.createdAt) ?? updatedAt;
    const approvedAt = toTimestamp(existingLoanData?.approvedAt) ?? updatedAt;
    const startTimestamp = dateStringToTimestamp(resolvedStartDate) ?? toTimestamp(existingLoanData?.startDate);

    payload.isActive = true;
    payload.createdAt = createdAt;
    payload.approvedAt = approvedAt;
    if (startTimestamp) {
      payload.startDate = startTimestamp;
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

  return { updatedAt: updatedAt.toDate().toISOString() };
}

export async function cancelLoanAndApplication(input: LoanCancelInput) {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.loanId) {
    throw new Error("Loan id is missing.");
  }
  if (!input.reason?.trim()) {
    throw new Error("Reason is required.");
  }

  const updatedAt = Timestamp.now();
  const batch = db.batch();
  const loanRef = db.collection("loans").doc(input.loanId);
  let borrowerId = input.borrowerId;
  let applicationId = input.applicationId;
  let actorName = input.actorName;

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

  actorName = await resolveActorName(input.actorUserId, actorName);
  const noteRef = loanRef.collection("notes").doc();
  const noteData = buildLoanNoteData({
    noteId: noteRef.id,
    loanId: input.loanId,
    borrowerId,
    applicationId,
    type: "loanNotes",
    note: `Loan cancelled: ${input.reason.trim()}`,
    createdAt: updatedAt.toDate().toISOString(),
    createdByName: actorName,
    createdByUserId: input.actorUserId
  });
  batch.set(noteRef, { ...noteData, createdAt: updatedAt });

  await batch.commit();

  return { updatedAt: updatedAt.toDate().toISOString() };
}

export async function closeLoanEarly(input: LoanCloseInput) {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!input.loanId) {
    throw new Error("Loan id is missing.");
  }
  if (!input.reason?.trim()) {
    throw new Error("Reason is required.");
  }

  const updatedAt = Timestamp.now();
  const loanRef = db.collection("loans").doc(input.loanId);
  const loanDoc = await loanRef.get();
  if (!loanDoc.exists) {
    throw new Error("Loan record not found.");
  }

  const loanData = loanDoc.data() || {};
  if (loanData.status !== "active") {
    throw new Error("Only active loans can be closed early.");
  }
  const borrowerId =
    input.borrowerId ?? (typeof loanData.borrowerId === "string" ? loanData.borrowerId : undefined);
  const applicationId =
    input.applicationId ?? (typeof loanData.applicationId === "string" ? loanData.applicationId : undefined);
  const actorName = await resolveActorName(input.actorUserId, input.actorName);

  const noteRef = loanRef.collection("notes").doc();
  const noteData = buildLoanNoteData({
    noteId: noteRef.id,
    loanId: input.loanId,
    borrowerId,
    applicationId,
    type: "loanNotes",
    note: `Loan closed early: ${input.reason.trim()}`,
    createdAt: updatedAt.toDate().toISOString(),
    createdByName: actorName,
    createdByUserId: input.actorUserId
  });

  const batch = db.batch();
  batch.set(
    loanRef,
    {
      status: "closed",
      isActive: false,
      updatedAt
    },
    { merge: true }
  );
  batch.set(noteRef, { ...noteData, createdAt: updatedAt });
  if (borrowerId && applicationId) {
    const applicationRef = db
      .collection("borrowers")
      .doc(borrowerId)
      .collection("application")
      .doc(applicationId);
    batch.set(
      applicationRef,
      {
        status: "closed",
        updatedAt
      },
      { merge: true }
    );
  }
  await batch.commit();

  return { updatedAt: updatedAt.toDate().toISOString() };
}
