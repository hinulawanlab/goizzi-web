import { NextResponse, type NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { auth, db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import type { UserRole, UserStatus, UserSummary } from "@/shared/types/user";

const validRoles: UserRole[] = ["admin", "team lead", "team member", "auditor"];
const validStatuses: UserStatus[] = ["active", "inactive", "suspend"];

interface CreateUserPayload {
  displayName?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  branchId?: string;
  branchName?: string;
  password?: string;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function formatDate(value: Timestamp): string {
  return value.toDate().toISOString().split("T")[0];
}

type UserDocLike = {
  displayName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  branchId?: string;
  branchName: string;
  phone?: string;
  createdAt: Timestamp;
};

function buildUserSummary(userId: string, payload: UserDocLike): UserSummary {
  return {
    userId,
    displayName: payload.displayName,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    branchId: payload.branchId,
    branchName: payload.branchName,
    status: payload.status,
    createdAt: formatDate(payload.createdAt),
    lastActiveAt: formatDate(payload.createdAt),
    permissions: []
  };
}

export async function POST(request: NextRequest) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }
  if (!db || !auth) {
    return NextResponse.json({ error: "Firebase Admin services are not initialized." }, { status: 500 });
  }

  let payload: CreateUserPayload = {};
  try {
    payload = (await request.json()) as CreateUserPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const displayName = normalizeString(payload.displayName);
  const email = normalizeString(payload.email);
  const password = normalizeString(payload.password);
  const role = payload.role;
  const status = payload.status;
  const branchId = normalizeString(payload.branchId);
  const branchName = normalizeString(payload.branchName) ?? branchId;

  if (!displayName || !email || !password) {
    return NextResponse.json({ error: "Display name, email, and password are required." }, { status: 400 });
  }

  if (!role || !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role value." }, { status: 400 });
  }

  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  if (!branchId || !branchName) {
    return NextResponse.json({ error: "Branch is required." }, { status: 400 });
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      disabled: status !== "active"
    });

    const now = Timestamp.now();
    const userId = userRecord.uid;

    const userDoc = {
      userId,
      displayName,
      email,
      role,
      status,
      branchId,
      branchName,
      createdAt: now,
      updatedAt: now
    };

    await db.collection("users").doc(userId).set(userDoc);

    const summary = buildUserSummary(userId, {
      ...userDoc,
      phone: undefined
    });

    return NextResponse.json({ user: summary });
  } catch (error) {
    console.warn("Unable to create user:", error);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
