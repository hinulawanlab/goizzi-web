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
  const valid: LoanStatus[] = ["draft", "approved", "active", "delinquent", "closed", "writtenOff", "cancelled"];
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
    totalOutstandingAmount: toNumber(data.balances?.totalOutstandingAmount),
    currency: typeof data.currency === "string" ? data.currency : undefined,
    startDate: formatTimestamp(data.startDate),
    nextDueDate: formatTimestamp(data.nextDueDate),
    lastPaymentAt: formatTimestamp(data.lastPaymentAt),
    updatedAt: formatTimestamp(data.updatedAt)
  };
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

  return snapshot.docs.map(mapLoanDoc);
}

async function fetchLoanByIdFromFirestore(loanId: string): Promise<LoanSummary | null> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const doc = await db.collection("loans").doc(loanId).get();
  if (!doc.exists) {
    return null;
  }

  return mapLoanDoc(doc);
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
