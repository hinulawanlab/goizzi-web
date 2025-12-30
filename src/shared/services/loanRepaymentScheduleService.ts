import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoBorrowerLoans } from "@/shared/data/demoBorrowerLoans";
import type { RepaymentScheduleEntry } from "@/shared/types/repaymentSchedule";
import { buildRepaymentSchedule } from "@/shared/utils/repaymentSchedule";

function formatTimestamp(value: unknown): string {
  if (!value) {
    return "N/A";
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

  return "N/A";
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

function mapScheduleDoc(doc: DocumentSnapshot): RepaymentScheduleEntry {
  const data = doc.data() || {};
  const breakdown = data.breakdown as Record<string, unknown> | undefined;

  return {
    scheduleId: doc.id,
    dueDate: formatTimestamp(data.dueDate),
    installmentNumber: toNumber(data.installmentNumber),
    scheduleType: typeof data.scheduleType === "string" ? (data.scheduleType as "regular" | "custom") : undefined,
    expectedPaymentAmount: toNumber(data.expectedPaymentAmount),
    amountPaidAmount: toNumber(data.amountPaidAmount),
    breakdown: breakdown
      ? {
          principalAmount: toNumber(breakdown.principalAmount),
          interestAmount: toNumber(breakdown.interestAmount),
          financeChargeAmount: toNumber(breakdown.financeChargeAmount),
          lateChargeAmount: toNumber(breakdown.lateChargeAmount),
          otherAmount: toNumber(breakdown.otherAmount)
        }
      : undefined,
    remarks: typeof data.remarks === "string" ? data.remarks : undefined,
    paymentStatus: typeof data.paymentStatus === "string" ? (data.paymentStatus as "unpaid" | "paid") : undefined,
    paidAt: formatTimestamp(data.paidAt),
    updatedAt: formatTimestamp(data.updatedAt)
  };
}

function resolveDemoScheduleByLoanId(loanId: string): RepaymentScheduleEntry[] {
  const loans = Object.values(demoBorrowerLoans).flat();
  const loan = loans.find((item) => item.loanId === loanId);
  if (!loan || !loan.startDate || !loan.termMonths || !loan.paymentFrequency) {
    return [];
  }

  const scheduleDates = buildRepaymentSchedule(loan.startDate, loan.termMonths, loan.paymentFrequency);
  const totalPayments = loan.termMonths * loan.paymentFrequency;
  const expectedPaymentAmount =
    typeof loan.principalAmount === "number" && typeof loan.interestRate === "number" && totalPayments > 0
      ? Math.round((loan.principalAmount * loan.termMonths * loan.interestRate) / totalPayments)
      : undefined;
  return scheduleDates.map((dueDate, index) => ({
    scheduleId: `installment-${index + 1}`,
    dueDate,
    installmentNumber: index + 1,
    scheduleType: "regular",
    expectedPaymentAmount
  }));
}

async function fetchScheduleFromFirestore(loanId: string): Promise<RepaymentScheduleEntry[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("loans")
    .doc(loanId)
    .collection("repaymentSchedule")
    .orderBy("dueDate", "asc")
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(mapScheduleDoc);
}

export async function getLoanRepaymentSchedule(loanId: string): Promise<RepaymentScheduleEntry[]> {
  if (!loanId) {
    return [];
  }

  if (hasAdminCredentials()) {
    try {
      return await fetchScheduleFromFirestore(loanId);
    } catch (error) {
      console.warn(`Unable to fetch repayment schedule for ${loanId}:`, error);
    }
  }

  return resolveDemoScheduleByLoanId(loanId);
}
