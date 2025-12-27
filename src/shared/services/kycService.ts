import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials, storageBucket } from "@/shared/singletons/firebaseAdmin";
import { demoBorrowerBankStatementKycs } from "@/shared/data/demoBorrowerBankStatementKycs";
import { demoBorrowerOtherKycs } from "@/shared/data/demoBorrowerOtherKycs";
import { demoBorrowerPayslipKycs } from "@/shared/data/demoBorrowerPayslipKycs";
import { demoBorrowerProofOfBillingKycs } from "@/shared/data/demoBorrowerProofOfBillingKycs";
import { demoBorrowerPropertyTitleKycs } from "@/shared/data/demoBorrowerPropertyTitleKycs";
import type {
  BorrowerBankStatementKyc,
  BorrowerGovernmentIdKyc,
  BorrowerOtherKyc,
  BorrowerPayslipKyc,
  BorrowerPropertyTitleKyc,
  BorrowerProofOfBillingKyc
} from "@/shared/types/kyc";

function formatTimestamp(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return ((value as { toDate?: () => Date }).toDate as () => Date)().toISOString();
  }

  const toMillis = (value as { toMillis?: () => number }).toMillis;
  if (typeof toMillis === "function") {
    return new Date(toMillis()).toISOString();
  }

  const seconds = (value as { _seconds?: number })._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toISOString();
  }

  return undefined;
}

function normalizeStorageRef(ref: unknown): string | undefined {
  if (typeof ref !== "string") {
    return undefined;
  }
  const trimmed = ref.trim();
  if (!trimmed) {
    return undefined;
  }
  const normalized = trimmed.replace(/\/{2,}/g, "/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function normalizeStorageRefs(refs: unknown): string[] {
  if (!Array.isArray(refs)) {
    return [];
  }
  return refs.map(normalizeStorageRef).filter(Boolean) as string[];
}

function stripLeadingSlash(value: string): string {
  return value.replace(/^\/+/, "");
}

async function createSignedUrlsForRefs(refs: string[]): Promise<string[]> {
  if (!storageBucket) {
    return [];
  }
  const bucket = storageBucket;
  const normalized = refs.map(stripLeadingSlash).filter(Boolean);
  if (!normalized.length) {
    return [];
  }

  try {
    const signedUrls: [string][] = await Promise.all(
      normalized.map((path) =>
        bucket.file(path).getSignedUrl({
          action: "read",
          expires: Date.now() + 15 * 60 * 1000
        })
      )
    );
    return signedUrls.map((entry) => entry[0]);
  } catch (error) {
    console.warn("Unable to sign proof of billing image URLs:", error);
    return [];
  }
}

function findStorageRef(refs: string[], keyword: string): string | undefined {
  const lowered = keyword.toLowerCase();
  return refs.find((ref) => ref.toLowerCase().includes(lowered));
}

function mapGovernmentIdDoc(doc: DocumentSnapshot, borrowerId: string): BorrowerGovernmentIdKyc | null {
  const data = doc.data() || {};
  const normalizedRefs = normalizeStorageRefs(data.storageRefs);

  const frontStorageRef =
    normalizeStorageRef(data.frontStorageRef) ?? findStorageRef(normalizedRefs, "front");
  const backStorageRef =
    normalizeStorageRef(data.backStorageRef) ?? findStorageRef(normalizedRefs, "back");

  if (!frontStorageRef && !backStorageRef) {
    return null;
  }

  return {
    borrowerId,
    kycId: doc.id,
    idType: typeof data.idType === "string" ? data.idType : undefined,
    idNumber: typeof data.idNumber === "string" ? data.idNumber : undefined,
    frontStorageRef,
    backStorageRef,
    storageRefs: normalizedRefs,
    isApproved:
      typeof data.isApproved === "boolean"
        ? data.isApproved
        : typeof data.isApprove === "boolean"
          ? data.isApprove
          : undefined,
    createdAt: formatTimestamp(data.createdAt)
  };
}

function mapSelfieDoc(doc: DocumentSnapshot, borrowerId: string): BorrowerGovernmentIdKyc | null {
  const data = doc.data() || {};
  const normalizedRefs = normalizeStorageRefs(data.storageRefs);
  const primaryRef = normalizeStorageRef(data.storageRef);
  const storageRefs = primaryRef ? [primaryRef, ...normalizedRefs] : normalizedRefs;

  if (!storageRefs.length) {
    return null;
  }

  return {
    borrowerId,
    kycId: doc.id,
    storageRefs,
    isApproved:
      typeof data.isApproved === "boolean"
        ? data.isApproved
        : typeof data.isApprove === "boolean"
          ? data.isApprove
          : undefined,
    createdAt: formatTimestamp(data.createdAt)
  };
}

function mapProofOfBillingDoc(doc: DocumentSnapshot, borrowerId: string): BorrowerProofOfBillingKyc | null {
  const data = doc.data() || {};
  const normalizedRefs = normalizeStorageRefs(data.storageRefs);
  const primaryRef = normalizeStorageRef(data.storageRef);
  const storageRefs = primaryRef ? [primaryRef, ...normalizedRefs] : normalizedRefs;

  return {
    borrowerId,
    kycId: doc.id,
    documentType: typeof data.documentType === "string" ? data.documentType : undefined,
    storageRefs,
    isApproved:
      typeof data.isApproved === "boolean"
        ? data.isApproved
        : typeof data.isApprove === "boolean"
          ? data.isApprove
          : undefined,
    isWaived: typeof data.isWaived === "boolean" ? data.isWaived : undefined,
    createdAt: formatTimestamp(data.createdAt)
  };
}

function mapBankStatementDoc(doc: DocumentSnapshot, borrowerId: string): BorrowerBankStatementKyc | null {
  const data = doc.data() || {};
  const normalizedRefs = normalizeStorageRefs(data.storageRefs);
  const primaryRef = normalizeStorageRef(data.storageRef);
  const storageRefs = primaryRef ? [primaryRef, ...normalizedRefs] : normalizedRefs;

  return {
    borrowerId,
    kycId: doc.id,
    documentType: typeof data.documentType === "string" ? data.documentType : undefined,
    accountName: typeof data.accountName === "string" ? data.accountName : undefined,
    accountNumber: typeof data.accountNumber === "string" ? data.accountNumber : undefined,
    bankName: typeof data.bankName === "string" ? data.bankName : undefined,
    storageRefs,
    isApproved:
      typeof data.isApproved === "boolean"
        ? data.isApproved
        : typeof data.isApprove === "boolean"
          ? data.isApprove
          : undefined,
    isWaived: typeof data.isWaived === "boolean" ? data.isWaived : undefined,
    createdAt: formatTimestamp(data.createdAt)
  };
}

function mapPayslipDoc(doc: DocumentSnapshot, borrowerId: string): BorrowerPayslipKyc | null {
  const data = doc.data() || {};
  const normalizedRefs = normalizeStorageRefs(data.storageRefs);
  const primaryRef = normalizeStorageRef(data.storageRef);
  const storageRefs = primaryRef ? [primaryRef, ...normalizedRefs] : normalizedRefs;

  return {
    borrowerId,
    kycId: doc.id,
    documentType: typeof data.documentType === "string" ? data.documentType : undefined,
    employer: typeof data.employer === "string" ? data.employer : undefined,
    storageRefs,
    isApproved:
      typeof data.isApproved === "boolean"
        ? data.isApproved
        : typeof data.isApprove === "boolean"
          ? data.isApprove
          : undefined,
    isWaived: typeof data.isWaived === "boolean" ? data.isWaived : undefined,
    createdAt: formatTimestamp(data.createdAt)
  };
}

function mapPropertyTitleDoc(doc: DocumentSnapshot, borrowerId: string): BorrowerPropertyTitleKyc | null {
  const data = doc.data() || {};
  const normalizedRefs = normalizeStorageRefs(data.storageRefs);
  const primaryRef = normalizeStorageRef(data.storageRef);
  const storageRefs = primaryRef ? [primaryRef, ...normalizedRefs] : normalizedRefs;

  return {
    borrowerId,
    kycId: doc.id,
    documentType: typeof data.documentType === "string" ? data.documentType : undefined,
    storageRefs,
    isApproved:
      typeof data.isApproved === "boolean"
        ? data.isApproved
        : typeof data.isApprove === "boolean"
          ? data.isApprove
          : undefined,
    isWaived: typeof data.isWaived === "boolean" ? data.isWaived : undefined,
    createdAt: formatTimestamp(data.createdAt)
  };
}

function mapOtherDoc(doc: DocumentSnapshot, borrowerId: string): BorrowerOtherKyc | null {
  const data = doc.data() || {};
  const normalizedRefs = normalizeStorageRefs(data.storageRefs);
  const primaryRef = normalizeStorageRef(data.storageRef);
  const storageRefs = primaryRef ? [primaryRef, ...normalizedRefs] : normalizedRefs;

  return {
    borrowerId,
    kycId: doc.id,
    documentType: typeof data.documentType === "string" ? data.documentType : undefined,
    documentDescription: typeof data.documentDescription === "string" ? data.documentDescription : undefined,
    storageRefs,
    isApproved:
      typeof data.isApproved === "boolean"
        ? data.isApproved
        : typeof data.isApprove === "boolean"
          ? data.isApprove
          : undefined,
    isWaived: typeof data.isWaived === "boolean" ? data.isWaived : undefined,
    createdAt: formatTimestamp(data.createdAt)
  };
}

async function fetchGovernmentIdKyc(borrowerId: string): Promise<BorrowerGovernmentIdKyc | null> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .where("type", "==", "governmentId")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("No government ID KYC document found.");
  }

  return mapGovernmentIdDoc(snapshot.docs[0], borrowerId);
}

async function fetchGovernmentIdKycs(borrowerId: string, limit = 10): Promise<BorrowerGovernmentIdKyc[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .where("type", "==", "governmentId")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    throw new Error("No government ID KYC documents found.");
  }

  return snapshot.docs.map((doc) => mapGovernmentIdDoc(doc, borrowerId)).filter(Boolean) as BorrowerGovernmentIdKyc[];
}

async function fetchSelfieKycs(borrowerId: string, limit = 10): Promise<BorrowerGovernmentIdKyc[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .where("type", "==", "selfie")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    throw new Error("No selfie KYC documents found.");
  }

  return snapshot.docs.map((doc) => mapSelfieDoc(doc, borrowerId)).filter(Boolean) as BorrowerGovernmentIdKyc[];
}

async function fetchProofOfBillingKycs(borrowerId: string, limit = 10): Promise<BorrowerProofOfBillingKyc[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .where("type", "==", "proofOfBilling")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const mapped = snapshot.docs
    .map((doc) => mapProofOfBillingDoc(doc, borrowerId))
    .filter(Boolean) as BorrowerProofOfBillingKyc[];

  if (!storageBucket) {
    return mapped;
  }

  const withUrls = await Promise.all(
    mapped.map(async (kyc) => ({
      ...kyc,
      imageUrls: await createSignedUrlsForRefs(kyc.storageRefs ?? [])
    }))
  );

  return withUrls;
}

async function fetchBankStatementKycs(borrowerId: string, limit = 10): Promise<BorrowerBankStatementKyc[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .where("type", "==", "bankStatement")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const mapped = snapshot.docs
    .map((doc) => mapBankStatementDoc(doc, borrowerId))
    .filter(Boolean) as BorrowerBankStatementKyc[];

  if (!storageBucket) {
    return mapped;
  }

  const withUrls = await Promise.all(
    mapped.map(async (kyc) => ({
      ...kyc,
      imageUrls: await createSignedUrlsForRefs(kyc.storageRefs ?? [])
    }))
  );

  return withUrls;
}

async function fetchPayslipKycs(borrowerId: string, limit = 10): Promise<BorrowerPayslipKyc[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .where("type", "==", "paySlip")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const mapped = snapshot.docs
    .map((doc) => mapPayslipDoc(doc, borrowerId))
    .filter(Boolean) as BorrowerPayslipKyc[];

  if (!storageBucket) {
    return mapped;
  }

  const withUrls = await Promise.all(
    mapped.map(async (kyc) => ({
      ...kyc,
      imageUrls: await createSignedUrlsForRefs(kyc.storageRefs ?? [])
    }))
  );

  return withUrls;
}

async function fetchPropertyTitleKycs(borrowerId: string, limit = 10): Promise<BorrowerPropertyTitleKyc[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .where("type", "==", "propertyTitle")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const mapped = snapshot.docs
    .map((doc) => mapPropertyTitleDoc(doc, borrowerId))
    .filter(Boolean) as BorrowerPropertyTitleKyc[];

  if (!storageBucket) {
    return mapped;
  }

  const withUrls = await Promise.all(
    mapped.map(async (kyc) => ({
      ...kyc,
      imageUrls: await createSignedUrlsForRefs(kyc.storageRefs ?? [])
    }))
  );

  return withUrls;
}

async function fetchOtherKycs(borrowerId: string, limit = 10): Promise<BorrowerOtherKyc[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .where("type", "==", "others")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const mapped = snapshot.docs
    .map((doc) => mapOtherDoc(doc, borrowerId))
    .filter(Boolean) as BorrowerOtherKyc[];

  if (!storageBucket) {
    return mapped;
  }

  const withUrls = await Promise.all(
    mapped.map(async (kyc) => ({
      ...kyc,
      imageUrls: await createSignedUrlsForRefs(kyc.storageRefs ?? [])
    }))
  );

  return withUrls;
}

export async function getBorrowerGovernmentIdKyc(borrowerId: string): Promise<BorrowerGovernmentIdKyc | null> {
  if (!borrowerId) {
    return null;
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchGovernmentIdKyc(borrowerId);
    } catch (error) {
      console.warn(`Unable to fetch government ID KYC for ${borrowerId}:`, error);
    }
  }

  return null;
}

export async function getBorrowerGovernmentIdKycs(
  borrowerId: string,
  limit = 10
): Promise<BorrowerGovernmentIdKyc[]> {
  if (!borrowerId) {
    return [];
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchGovernmentIdKycs(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch government ID KYC list for ${borrowerId}:`, error);
    }
  }

  return [];
}

export async function getBorrowerSelfieKycs(borrowerId: string, limit = 10): Promise<BorrowerGovernmentIdKyc[]> {
  if (!borrowerId) {
    return [];
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchSelfieKycs(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch selfie KYC list for ${borrowerId}:`, error);
    }
  }

  return [];
}

export async function getBorrowerProofOfBillingKycs(
  borrowerId: string,
  limit = 10
): Promise<BorrowerProofOfBillingKyc[]> {
  if (!borrowerId) {
    return [];
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchProofOfBillingKycs(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch proof of billing KYC list for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerProofOfBillingKycs[borrowerId] ?? [];
}

export async function getBorrowerBankStatementKycs(
  borrowerId: string,
  limit = 10
): Promise<BorrowerBankStatementKyc[]> {
  if (!borrowerId) {
    return [];
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchBankStatementKycs(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch bank statement KYC list for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerBankStatementKycs[borrowerId] ?? [];
}

export async function getBorrowerPayslipKycs(
  borrowerId: string,
  limit = 10
): Promise<BorrowerPayslipKyc[]> {
  if (!borrowerId) {
    return [];
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchPayslipKycs(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch payslip KYC list for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerPayslipKycs[borrowerId] ?? [];
}

export async function getBorrowerPropertyTitleKycs(
  borrowerId: string,
  limit = 10
): Promise<BorrowerPropertyTitleKyc[]> {
  if (!borrowerId) {
    return [];
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchPropertyTitleKycs(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch property title KYC list for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerPropertyTitleKycs[borrowerId] ?? [];
}

export async function getBorrowerOtherKycs(
  borrowerId: string,
  limit = 10
): Promise<BorrowerOtherKyc[]> {
  if (!borrowerId) {
    return [];
  }
  if (hasAdminCredentials()) {
    try {
      return await fetchOtherKycs(borrowerId, limit);
    } catch (error) {
      console.warn(`Unable to fetch other KYC list for ${borrowerId}:`, error);
    }
  }

  return demoBorrowerOtherKycs[borrowerId] ?? [];
}

export async function setBorrowerGovernmentIdApproval(
  borrowerId: string,
  kycId: string,
  isApproved: boolean
): Promise<void> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }
  if (!borrowerId || !kycId) {
    throw new Error("Borrower or KYC id is missing.");
  }

  await db
    .collection("borrowers")
    .doc(borrowerId)
    .collection("kyc")
    .doc(kycId)
    .set(
      {
        isApproved
      },
      { merge: true }
    );
}
