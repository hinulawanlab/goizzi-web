import { FieldPath } from "firebase-admin/firestore";
import type { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";

import { db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";

const SEARCH_INDEX_COLLECTION = "borrowerSearchIndex";
const SEARCH_INDEX_META_ID = "__meta__";
const SEARCH_INDEX_SCAN_BATCH = 400;

type BorrowerSearchIndexDoc = {
  borrowerId: string;
  fullName: string;
  fullNameNormalized: string;
  sourcePath: string;
  sourceDepth: number;
  searchTokens: string[];
  updatedAt: number;
};

export type BorrowerSearchIndexMatch = {
  borrowerId: string;
  matchedName: string;
  sourcePath: string;
  sourceDepth: number;
  score: number;
};

type NameSource = {
  borrowerId: string;
  fullName: string;
  fullNameNormalized: string;
  sourcePath: string;
  sourceDepth: number;
  searchTokens: string[];
};

let ensureIndexPromise: Promise<void> | null = null;
let indexReadyAt = 0;

function normalizeSearchTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tokenize(value: string): string[] {
  return normalizeSearchTerm(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function buildPrefixes(token: string): string[] {
  const prefixes: string[] = [];
  for (let index = 2; index <= token.length; index += 1) {
    prefixes.push(token.slice(0, index));
  }
  return prefixes;
}

function buildSearchTokens(fullName: string, borrowerId: string): string[] {
  const tokens = new Set<string>();
  const nameTokens = tokenize(fullName);
  const borrowerIdTokens = tokenize(borrowerId);

  [...nameTokens, ...borrowerIdTokens].forEach((token) => {
    tokens.add(token);
    buildPrefixes(token).forEach((prefix) => tokens.add(prefix));
  });

  const normalizedName = normalizeSearchTerm(fullName);
  if (normalizedName) {
    tokens.add(normalizedName);
  }

  return Array.from(tokens);
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0).toString(36);
}

function makeIndexDocId(borrowerId: string, sourcePath: string, fullName: string): string {
  return `${borrowerId}_${hashString(`${sourcePath}|${normalizeSearchTerm(fullName)}`)}`;
}

async function collectNameSourcesFromSnapshot(
  borrowerId: string,
  doc: QueryDocumentSnapshot,
  sourceDepth: number,
  output: NameSource[]
): Promise<void> {
  const data = doc.data() || {};
  const borrowerMap = typeof data.borrower === "object" && data.borrower !== null
    ? (data.borrower as Record<string, unknown>)
    : null;
  const nestedBorrowerFullName =
    borrowerMap && typeof borrowerMap.fullName === "string" ? borrowerMap.fullName.trim() : "";
  const topLevelFullName = typeof data.fullName === "string" ? data.fullName.trim() : "";
  const fullName = nestedBorrowerFullName || topLevelFullName;
  if (fullName) {
    output.push({
      borrowerId,
      fullName,
      fullNameNormalized: normalizeSearchTerm(fullName),
      sourcePath: doc.ref.path,
      sourceDepth,
      searchTokens: buildSearchTokens(fullName, borrowerId)
    });
  }

  const subCollections = await doc.ref.listCollections();
  for (const collection of subCollections) {
    const snapshot = await collection.get();
    for (const subDoc of snapshot.docs) {
      await collectNameSourcesFromSnapshot(borrowerId, subDoc, sourceDepth + 1, output);
    }
  }
}

async function deleteBorrowerIndexDocs(borrowerId: string): Promise<void> {
  if (!db) {
    return;
  }

  while (true) {
    const snapshot = await db
      .collection(SEARCH_INDEX_COLLECTION)
      .where("borrowerId", "==", borrowerId)
      .limit(200)
      .get();

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function writeBorrowerIndexDocs(entries: NameSource[]): Promise<void> {
  if (!db || !entries.length) {
    return;
  }
  const adminDb = db;

  for (let index = 0; index < entries.length; index += 400) {
    const chunk = entries.slice(index, index + 400);
    const batch = db.batch();
    const now = Date.now();

    chunk.forEach((entry) => {
      const docId = makeIndexDocId(entry.borrowerId, entry.sourcePath, entry.fullName);
      const payload: BorrowerSearchIndexDoc = {
        borrowerId: entry.borrowerId,
        fullName: entry.fullName,
        fullNameNormalized: entry.fullNameNormalized,
        sourcePath: entry.sourcePath,
        sourceDepth: entry.sourceDepth,
        searchTokens: entry.searchTokens,
        updatedAt: now
      };
      batch.set(adminDb.collection(SEARCH_INDEX_COLLECTION).doc(docId), payload, { merge: true });
    });

    await batch.commit();
  }
}

export async function rebuildBorrowerSearchIndexForBorrower(borrowerId: string): Promise<void> {
  if (!hasAdminCredentials() || !db || !borrowerId) {
    return;
  }

  const borrowerDoc = await db.collection("borrowers").doc(borrowerId).get();
  if (!borrowerDoc.exists) {
    await deleteBorrowerIndexDocs(borrowerId);
    return;
  }

  const entries: NameSource[] = [];
  await collectNameSourcesFromSnapshot(
    borrowerId,
    borrowerDoc as QueryDocumentSnapshot,
    0,
    entries
  );

  await deleteBorrowerIndexDocs(borrowerId);
  await writeBorrowerIndexDocs(entries);
}

export async function rebuildAllBorrowerSearchIndexes(): Promise<void> {
  if (!hasAdminCredentials() || !db) {
    return;
  }

  let lastDoc: DocumentSnapshot | null = null;
  while (true) {
    let query = db
      .collection("borrowers")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(100);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const borrowerDoc of snapshot.docs) {
      await rebuildBorrowerSearchIndexForBorrower(borrowerDoc.id);
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    if (snapshot.size < 100) {
      break;
    }
  }

  await db.collection(SEARCH_INDEX_COLLECTION).doc(SEARCH_INDEX_META_ID).set(
    {
      refreshedAt: Date.now()
    },
    { merge: true }
  );
  indexReadyAt = Date.now();
}

function warmUpSearchIndexInBackground(): void {
  if (!hasAdminCredentials() || !db) {
    return;
  }

  const now = Date.now();
  if (indexReadyAt && now - indexReadyAt < 60 * 1000) {
    return;
  }

  if (ensureIndexPromise) {
    return;
  }

  ensureIndexPromise = (async () => {
    const sample = await db.collection(SEARCH_INDEX_COLLECTION).limit(1).get();
    if (sample.empty) {
      await rebuildAllBorrowerSearchIndexes();
      return;
    }

    indexReadyAt = Date.now();
  })();
  void ensureIndexPromise.finally(() => {
    ensureIndexPromise = null;
  });
}

function calculateScore(fullNameNormalized: string, searchTermNormalized: string, sourceDepth: number): number {
  if (fullNameNormalized === searchTermNormalized) {
    return 100 - sourceDepth;
  }
  if (fullNameNormalized.startsWith(searchTermNormalized)) {
    return 90 - sourceDepth;
  }
  if (fullNameNormalized.includes(` ${searchTermNormalized}`)) {
    return 80 - sourceDepth;
  }
  return 70 - sourceDepth;
}

export async function searchBorrowerIndexByFullName(searchTerm: string): Promise<BorrowerSearchIndexMatch[]> {
  if (!hasAdminCredentials() || !db) {
    return [];
  }

  const normalized = normalizeSearchTerm(searchTerm);
  const tokens = tokenize(normalized);
  if (!normalized || !tokens.length) {
    return [];
  }

  warmUpSearchIndexInBackground();

  const anchorToken = tokens.slice().sort((left, right) => right.length - left.length)[0];
  if (!anchorToken) {
    return [];
  }

  const matchesByBorrower = new Map<string, BorrowerSearchIndexMatch>();
  let lastDoc: QueryDocumentSnapshot | null = null;

  while (true) {
    let query = db
      .collection(SEARCH_INDEX_COLLECTION)
      .where("searchTokens", "array-contains", anchorToken)
      .limit(SEARCH_INDEX_SCAN_BATCH);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const doc of snapshot.docs) {
      const data = doc.data() as Partial<BorrowerSearchIndexDoc>;
      if (!data.borrowerId || !data.fullName || !data.fullNameNormalized || data.sourcePath == null) {
        continue;
      }
      if (doc.id === SEARCH_INDEX_META_ID) {
        continue;
      }

      const matchesAllTokens = tokens.every((token) => data.fullNameNormalized?.includes(token));
      if (!matchesAllTokens) {
        continue;
      }

      const sourceDepth = typeof data.sourceDepth === "number" ? data.sourceDepth : 0;
      const score = calculateScore(data.fullNameNormalized, normalized, sourceDepth);
      const existing = matchesByBorrower.get(data.borrowerId);
      if (!existing || existing.score < score) {
        matchesByBorrower.set(data.borrowerId, {
          borrowerId: data.borrowerId,
          matchedName: data.fullName,
          sourcePath: data.sourcePath,
          sourceDepth,
          score
        });
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    if (snapshot.size < SEARCH_INDEX_SCAN_BATCH) {
      break;
    }
  }

  return Array.from(matchesByBorrower.values()).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.matchedName.localeCompare(right.matchedName);
  });
}
