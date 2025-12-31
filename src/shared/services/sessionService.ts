import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { auth, db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import type { UserRole, UserStatus } from "@/shared/types/user";

const SESSION_COOKIE_NAME = "__session";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const SESSION_CACHE_TTL_MS = 60 * 1000;

const validRoles: UserRole[] = ["admin", "team lead", "team member", "auditor"];
const validStatuses: UserStatus[] = ["active", "inactive", "suspend"];

type StaffSession = {
  uid: string;
  role: UserRole;
  status: UserStatus;
};

type CacheEntry = {
  expiresAt: number;
  session: StaffSession | null;
};

const sessionCache = new Map<string, CacheEntry>();

function getCachedSession(cookieValue: string): StaffSession | null | undefined {
  const cached = sessionCache.get(cookieValue);
  if (!cached) {
    return undefined;
  }
  if (cached.expiresAt <= Date.now()) {
    sessionCache.delete(cookieValue);
    return undefined;
  }
  return cached.session;
}

function setCachedSession(cookieValue: string, session: StaffSession | null) {
  sessionCache.set(cookieValue, {
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    session
  });
}

function normalizeRole(role: unknown): UserRole | null {
  return typeof role === "string" && validRoles.includes(role as UserRole) ? (role as UserRole) : null;
}

function normalizeStatus(status: unknown): UserStatus | null {
  return typeof status === "string" && validStatuses.includes(status as UserStatus) ? (status as UserStatus) : null;
}

async function loadStaffSession(uid: string): Promise<StaffSession | null> {
  if (!db) {
    return null;
  }

  const snapshot = await db.collection("users").doc(uid).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() || {};
  const role = normalizeRole(data.role);
  const status = normalizeStatus(data.status);

  if (!role || status !== "active") {
    return null;
  }

  return { uid, role, status };
}

async function resolveStaffSessionFromCookie(cookieValue?: string): Promise<StaffSession | null> {
  if (!cookieValue || !hasAdminCredentials() || !auth) {
    return null;
  }

  const cached = getCachedSession(cookieValue);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const decoded = await auth.verifySessionCookie(cookieValue, true);
    const session = await loadStaffSession(decoded.uid);
    setCachedSession(cookieValue, session);
    return session;
  } catch (error) {
    console.warn("Session cookie verification failed:", error);
    setCachedSession(cookieValue, null);
    return null;
  }
}

export async function resolveStaffSessionFromRequest(request: NextRequest): Promise<StaffSession | null> {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return resolveStaffSessionFromCookie(cookieValue);
}

export async function requireStaffSession(): Promise<StaffSession> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await resolveStaffSessionFromCookie(cookieValue);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function createStaffSessionCookie(idToken: string): Promise<string> {
  if (!hasAdminCredentials() || !auth) {
    throw new Error("Firebase Admin credentials are not configured.");
  }

  const decoded = await auth.verifyIdToken(idToken);
  const session = await loadStaffSession(decoded.uid);
  if (!session) {
    throw new Error("Staff record not found or inactive.");
  }

  return auth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeMs() {
  return SESSION_MAX_AGE_MS;
}
