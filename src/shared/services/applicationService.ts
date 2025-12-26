import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoBorrowerApplications } from "@/shared/data/demoBorrowerApplications";
import type {
  ApplicationBorrower,
  BorrowerAssets,
  BorrowerIncome,
  CoMaker,
  CoMakerIncome,
  LoanApplication,
  LoanDetails,
  MarketingInfo,
  SpouseInfo
} from "@/shared/types/loanApplication";

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

function normalizeString(value: unknown, fallback = "N/A"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return fallback;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  return undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const normalized = value.filter((entry) => typeof entry === "string") as string[];
  return normalized.length ? normalized : undefined;
}

function mapBorrower(raw: Record<string, unknown>): ApplicationBorrower {
  return {
    age: normalizeString(raw.age, "N/A"),
    birthplace: normalizeString(raw.birthplace, "N/A"),
    citizenship: normalizeString(raw.citizenship, "N/A"),
    civilStatus: normalizeString(raw.civilStatus, "N/A"),
    course: normalizeString(raw.course, "N/A"),
    currentAddress: normalizeString(raw.currentAddress, "N/A"),
    dateOfBirth: normalizeString(raw.dateOfBirth, "N/A"),
    dependents: normalizeString(raw.dependents, "N/A"),
    educationAttainment: normalizeString(raw.educationAttainment, "N/A"),
    email: normalizeString(raw.email, "N/A"),
    facebookAccount: normalizeString(raw.facebookAccount, "N/A"),
    fatherName: normalizeString(raw.fatherName, "N/A"),
    fullName: normalizeString(raw.fullName, "Unknown borrower"),
    gender: normalizeString(raw.gender, "N/A"),
    homeOwnership: normalizeString(raw.homeOwnership, "N/A"),
    mobileNumber: normalizeString(raw.mobileNumber, "N/A"),
    motherMaidenName: normalizeString(raw.motherMaidenName, "N/A"),
    nickname: normalizeString(raw.nickname, "N/A"),
    provincialAddress: normalizeString(raw.provincialAddress, "N/A"),
    provincialSameAsCurrent: normalizeBoolean(raw.provincialSameAsCurrent),
    yearsAtAddress: normalizeString(raw.yearsAtAddress, "N/A")
  };
}

function mapBorrowerAssets(raw: Record<string, unknown>): BorrowerAssets {
  return {
    details: normalizeString(raw.details, "N/A"),
    estimatedValue: normalizeString(raw.estimatedValue, "N/A"),
    selections: normalizeStringArray(raw.selections)
  };
}

function mapBorrowerIncome(raw: Record<string, unknown>): BorrowerIncome {
  return {
    employerAddress: normalizeString(raw.employerAddress, "N/A"),
    employerContact: normalizeString(raw.employerContact, "N/A"),
    employerName: normalizeString(raw.employerName, "N/A"),
    netIncome: normalizeString(raw.netIncome, "N/A"),
    occupation: normalizeString(raw.occupation, "N/A"),
    yearsInRole: normalizeString(raw.yearsInRole, "N/A")
  };
}

function mapCoMaker(raw: Record<string, unknown>): CoMaker {
  return {
    age: normalizeString(raw.age, "N/A"),
    citizenship: normalizeString(raw.citizenship, "N/A"),
    civilStatus: normalizeString(raw.civilStatus, "N/A"),
    currentAddress: normalizeString(raw.currentAddress, "N/A"),
    dependents: normalizeString(raw.dependents, "N/A"),
    email: normalizeString(raw.email, "N/A"),
    facebookAccount: normalizeString(raw.facebookAccount, "N/A"),
    fullName: normalizeString(raw.fullName, "N/A"),
    homeOwnership: normalizeString(raw.homeOwnership, "N/A"),
    mobileNumber: normalizeString(raw.mobileNumber, "N/A"),
    nickname: normalizeString(raw.nickname, "N/A"),
    provincialAddress: normalizeString(raw.provincialAddress, "N/A"),
    relationshipToBorrower: normalizeString(raw.relationshipToBorrower, "N/A"),
    yearsAtAddress: normalizeString(raw.yearsAtAddress, "N/A")
  };
}

function mapCoMakerIncome(raw: Record<string, unknown>): CoMakerIncome {
  return {
    employerAddress: normalizeString(raw.employerAddress, "N/A"),
    employerContact: normalizeString(raw.employerContact, "N/A"),
    employerName: normalizeString(raw.employerName, "N/A"),
    netIncome: normalizeString(raw.netIncome, "N/A"),
    occupation: normalizeString(raw.occupation, "N/A"),
    yearsInRole: normalizeString(raw.yearsInRole, "N/A")
  };
}

function mapSpouse(raw: Record<string, unknown>): SpouseInfo {
  return {
    address: normalizeString(raw.address, "N/A"),
    contactNumber: normalizeString(raw.contactNumber, "N/A"),
    employerContact: normalizeString(raw.employerContact, "N/A"),
    employerName: normalizeString(raw.employerName, "N/A"),
    fullName: normalizeString(raw.fullName, "N/A"),
    netIncome: normalizeString(raw.netIncome, "N/A"),
    nickname: normalizeString(raw.nickname, "N/A"),
    occupation: normalizeString(raw.occupation, "N/A"),
    yearsInRole: normalizeString(raw.yearsInRole, "N/A")
  };
}

function mapLoanDetails(raw: Record<string, unknown>): LoanDetails {
  return {
    amountApplied: normalizeString(raw.amountApplied, "N/A"),
    productId: normalizeString(raw.productId, "N/A"),
    productName: normalizeString(raw.productName, "N/A"),
    purpose: normalizeString(raw.purpose, "N/A"),
    term: normalizeString(raw.term, "N/A")
  };
}

function mapMarketing(raw: Record<string, unknown>): MarketingInfo {
  return {
    source: normalizeString(raw.source, "N/A")
  };
}

function mapApplicationDoc(doc: DocumentSnapshot): LoanApplication {
  const data = doc.data() || {};
  const borrower = (data.borrower as Record<string, unknown>) ?? {};
  const borrowerAssets = (data.borrowerAssets as Record<string, unknown>) ?? {};
  const borrowerIncome = (data.borrowerIncome as Record<string, unknown>) ?? {};
  const coMaker = (data.coMaker as Record<string, unknown>) ?? {};
  const coMakerIncome = (data.coMakerIncome as Record<string, unknown>) ?? {};
  const spouse = (data.spouse as Record<string, unknown>) ?? {};
  const loanDetails = (data.loanDetails as Record<string, unknown>) ?? {};
  const marketing = (data.marketing as Record<string, unknown>) ?? {};

  return {
    applicationId: doc.id,
    status: normalizeString(data.status, "draft"),
    createdAt: formatTimestamp(data.createdAt),
    submittedAt: formatTimestamp(data.submittedAt),
    updatedAt: formatTimestamp(data.updatedAt),
    statusUpdatedByName: typeof data.statusUpdatedByName === "string" ? data.statusUpdatedByName : undefined,
    statusUpdatedByUserId: typeof data.statusUpdatedByUserId === "string" ? data.statusUpdatedByUserId : undefined,
    borrower: mapBorrower(borrower),
    borrowerAssets: mapBorrowerAssets(borrowerAssets),
    borrowerIncome: mapBorrowerIncome(borrowerIncome),
    coMaker: mapCoMaker(coMaker),
    coMakerIncome: mapCoMakerIncome(coMakerIncome),
    spouse: mapSpouse(spouse),
    loanDetails: mapLoanDetails(loanDetails),
    marketing: mapMarketing(marketing)
  };
}

async function fetchBorrowerApplicationsFromFirestore(borrowerId: string, limit = 20): Promise<LoanApplication[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("application")
    .orderBy("submittedAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(mapApplicationDoc);
}

export async function getBorrowerApplications(borrowerId: string, limit = 20): Promise<LoanApplication[]> {
  if (!borrowerId) {
    return [];
  }

  if (hasAdminCredentials()) {
    try {
      return await fetchBorrowerApplicationsFromFirestore(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch applications for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerApplications[borrowerId] ?? [];
}

async function fetchBorrowerApplicationById(
  borrowerId: string,
  applicationId: string
): Promise<LoanApplication | null> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const doc = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("application")
    .doc(applicationId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return mapApplicationDoc(doc);
}

export async function getBorrowerApplicationById(
  borrowerId: string,
  applicationId: string
): Promise<LoanApplication | null> {
  if (!borrowerId || !applicationId) {
    return null;
  }

  if (hasAdminCredentials()) {
    try {
      return await fetchBorrowerApplicationById(borrowerId, applicationId);
    } catch (error) {
      console.warn(`Unable to fetch application ${applicationId} for ${borrowerId}:`, error);
    }
  }

  const demoApplications = demoBorrowerApplications[borrowerId] ?? [];
  return demoApplications.find((application) => application.applicationId === applicationId) ?? null;
}
