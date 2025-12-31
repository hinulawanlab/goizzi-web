import { NextResponse, type NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { auth, db, hasAdminCredentials } from "@/shared/singletons/firebaseAdmin";
import { resolveStaffSessionFromRequest } from "@/shared/services/sessionService";
import type { UserRole, UserStatus, UserSummary } from "@/shared/types/user";

const validRoles: UserRole[] = ["admin", "team lead", "team member", "auditor"];
const validStatuses: UserStatus[] = ["active", "inactive", "suspend"];

interface UpdateUserPayload {
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

function buildUserSummary(userId: string, data: Record<string, unknown>): UserSummary {
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now();
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt : createdAt;

  return {
    userId,
    displayName: typeof data.displayName === "string" ? data.displayName : "Unknown staff",
    email: typeof data.email === "string" ? data.email : "unknown@goizzi.com",
    phone: typeof data.phone === "string" ? data.phone : undefined,
    role: validRoles.includes(data.role as UserRole) ? (data.role as UserRole) : "team member",
    branchId: typeof data.branchId === "string" ? data.branchId : undefined,
    branchName: typeof data.branchName === "string" ? data.branchName : "Company-wide",
    status: validStatuses.includes(data.status as UserStatus) ? (data.status as UserStatus) : "active",
    createdAt: formatDate(createdAt),
    lastActiveAt: formatDate(updatedAt),
    permissions: Array.isArray(data.permissions)
      ? data.permissions.filter((item): item is string => typeof item === "string")
      : []
  };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const session = await resolveStaffSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "Firebase Admin credentials are not configured." }, { status: 500 });
  }
  if (!db || !auth) {
    return NextResponse.json({ error: "Firebase Admin services are not initialized." }, { status: 500 });
  }

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  let payload: UpdateUserPayload = {};
  try {
    payload = (await request.json()) as UpdateUserPayload;
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

  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role value." }, { status: 400 });
  }

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  try {
    const docRef = db.collection("users").doc(userId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    const authUpdate: { displayName?: string; email?: string; disabled?: boolean; password?: string } = {};
    if (displayName) {
      authUpdate.displayName = displayName;
    }
    if (email) {
      authUpdate.email = email;
    }
    if (typeof status === "string") {
      authUpdate.disabled = status !== "active";
    }
    if (password) {
      authUpdate.password = password;
    }

    if (Object.keys(authUpdate).length) {
      await auth.updateUser(userId, authUpdate);
    }

    const now = Timestamp.now();
    const updates: Record<string, unknown> = {
      updatedAt: now
    };

    if (displayName) {
      updates.displayName = displayName;
    }
    if (email) {
      updates.email = email;
    }
    if (role) {
      updates.role = role;
    }
    if (status) {
      updates.status = status;
    }
    if (branchId) {
      updates.branchId = branchId;
    }
    if (branchName) {
      updates.branchName = branchName;
    }

    await docRef.update(updates);

    const refreshed = await docRef.get();
    const summary = buildUserSummary(userId, refreshed.data() ?? {});

    return NextResponse.json({ user: summary });
  } catch (error) {
    console.warn("Unable to update user:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
