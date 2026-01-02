import type { DocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { demoLoanProducts } from "@/shared/data/demoLoanProducts";
import type { LoanProductSummary } from "@/shared/types/product";

const CACHE_TTL_MS = 2 * 60 * 1000;

let cachedProducts: LoanProductSummary[] | null = null;
let cachedAt = 0;

function normalizeName(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function normalizeIsActive(data: Record<string, unknown>): boolean {
  if (typeof data.isActive === "boolean") {
    return data.isActive;
  }
  if (typeof data.status === "string") {
    return data.status === "active";
  }
  return false;
}

function mapProductDoc(doc: DocumentSnapshot): LoanProductSummary {
  const data = doc.data() || {};
  const productId = typeof data.productId === "string" ? data.productId : doc.id;
  const name = normalizeName(
    typeof data.name === "string" ? data.name : data.productName,
    productId
  );

  return {
    productId,
    name,
    isActive: normalizeIsActive(data)
  };
}

async function fetchActiveProductsFromFirestore(): Promise<LoanProductSummary[]> {
  if (!db) {
    throw new Error("Firestore Admin client is not initialized.");
  }

  const snapshot = await db.collection("products").where("isActive", "==", true).get();
  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(mapProductDoc);
}

function sortByName(products: LoanProductSummary[]) {
  return [...products].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getActiveLoanProducts(): Promise<LoanProductSummary[]> {
  const now = Date.now();
  if (cachedProducts && now - cachedAt < CACHE_TTL_MS) {
    return cachedProducts;
  }

  if (hasAdminCredentials()) {
    try {
      const products = await fetchActiveProductsFromFirestore();
      cachedProducts = sortByName(products.filter((product) => product.isActive));
      cachedAt = now;
      return cachedProducts;
    } catch (error) {
      console.warn("Unable to fetch products from Firestore:", error);
    }
  }

  cachedProducts = sortByName(demoLoanProducts.filter((product) => product.isActive));
  cachedAt = now;
  return cachedProducts;
}

export function clearLoanProductCache() {
  cachedProducts = null;
  cachedAt = 0;
}
