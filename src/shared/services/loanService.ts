import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoBorrowerLoans } from "@/shared/data/demoBorrowerLoans";
import type { LoanStatus, LoanSummary } from "@/shared/types/loan";

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

function normalizeStatus(value: unknown): LoanStatus {
  const valid: LoanStatus[] = [
    "draft",
    "approved",
    "active",
    "delinquent",
    "pastdue",
    "closed",
    "writtenOff",
    "cancelled"
  ];
  return typeof value === "string" && valid.includes(value as LoanStatus)
    ? (value as LoanStatus)
    : "draft";
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

function mapLoanDoc(doc: DocumentSnapshot): LoanSummary {
  const data = doc.data() || {};

  return {
    loanId: doc.id,
    borrowerId: typeof data.borrowerId === "string" ? data.borrowerId : "N/A",
    applicationId: typeof data.applicationId === "string" ? data.applicationId : undefined,
    status: normalizeStatus(data.status),
    productId: typeof data.productId === "string" ? data.productId : undefined,
    productName: typeof data.productName === "string" ? data.productName : undefined,
    principalAmount: toNumber(data.principalAmount),
    termMonths: toNumber(data.termMonths),
    termDays: toNumber(data.termDays),
    paymentFrequency: toNumber(data.paymentFrequency),
    interestRate: toNumber(data.interestRate),
    totalOutstandingAmount: toNumber(data.balances?.totalOutstandingAmount),
    currency: typeof data.currency === "string" ? data.currency : undefined,
    startDate: formatTimestamp(data.startDate),
    nextDueDate: formatTimestamp(data.nextDueDate),
    maturityDate: formatTimestamp(data.maturityDate),
    lastPaymentAt: formatTimestamp(data.lastPaymentAt),
    updatedAt: formatTimestamp(data.updatedAt),
    isFullpayment: typeof data.isFullpayment === "boolean" ? data.isFullpayment : undefined
  };
}

function isPastDueEligible(loan: LoanSummary) {
  if (loan.isFullpayment !== false) {
    return false;
  }
  if (!loan.maturityDate || loan.maturityDate === "N/A") {
    return false;
  }
  if (["pastdue", "closed", "writtenOff", "cancelled"].includes(loan.status)) {
    return false;
  }
  const maturityMs = Date.parse(loan.maturityDate);
  if (Number.isNaN(maturityMs)) {
    return false;
  }
  return maturityMs <= Date.now();
}

async function updatePastDueStatuses(loans: LoanSummary[]): Promise<LoanSummary[]> {
  if (!db) {
    return loans;
  }

  const updates = loans.filter(isPastDueEligible);
  if (!updates.length) {
    return loans;
  }

  const updatedAt = new Date().toISOString();
  const batch = db.batch();
  const updatedIds = new Set<string>();
  for (const loan of updates) {
    const loanRef = db.collection("loans").doc(loan.loanId);
    batch.set(loanRef, { status: "pastdue", updatedAt }, { merge: true });
    updatedIds.add(loan.loanId);
  }
  await batch.commit();

  return loans.map((loan) =>
    updatedIds.has(loan.loanId) ? { ...loan, status: "pastdue", updatedAt } : loan
  );
}

async function fetchBorrowerLoansFromFirestore(borrowerId: string, limit = 50): Promise<LoanSummary[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("loans")
    .where("borrowerId", "==", borrowerId)
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const loans = snapshot.docs.map(mapLoanDoc);
  return updatePastDueStatuses(loans);
}

async function fetchLoanByIdFromFirestore(loanId: string): Promise<LoanSummary | null> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const doc = await db.collection("loans").doc(loanId).get();
  if (!doc.exists) {
    return null;
  }

  const loan = mapLoanDoc(doc);
  const [updatedLoan] = await updatePastDueStatuses([loan]);
  return updatedLoan ?? loan;
}

function findDemoLoanById(loanId: string): LoanSummary | null {
  for (const loans of Object.values(demoBorrowerLoans)) {
    const found = loans.find((loan) => loan.loanId === loanId);
    if (found) {
      return found;
    }
  }
  return null;
}

export async function getBorrowerLoans(borrowerId: string, limit = 50): Promise<LoanSummary[]> {
  if (!borrowerId) {
    return [];
  }

  if (hasAdminCredentials()) {
    try {
      return await fetchBorrowerLoansFromFirestore(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch loans for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerLoans[borrowerId] ?? [];
}

export async function getLoanById(loanId: string): Promise<LoanSummary | null> {
  if (!loanId) {
    return null;
  }

  if (hasAdminCredentials()) {
    try {
      return await fetchLoanByIdFromFirestore(loanId);
    } catch (error) {
      console.warn(`Unable to fetch loan ${loanId}:`, error);
    }
  }

  return findDemoLoanById(loanId);
}
